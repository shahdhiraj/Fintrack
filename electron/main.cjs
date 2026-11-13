/**
 * FinTrack for Windows (Electron).
 *
 * The built site (dist/) is served from a tiny local web server on http://localhost:<port>,
 * then shown in a window. Why localhost and a fixed port:
 *  - Firebase Auth accepts "localhost" as an authorized domain by default, so sign-in works.
 *  - The browser keys saved sign-ins and on-device data (IndexedDB, localStorage) by origin.
 *    A fixed port keeps users signed in and keeps their data between launches.
 * The server only listens on the loopback interface and only serves files from dist/.
 */
const { app, BrowserWindow, Menu, shell } = require('electron');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const DIST = path.join(__dirname, '..', 'dist');
const PORTS = [47821, 47822, 47823];
const START_PATH = '/dashboard';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
};

/** Same rules as Firebase Hosting: exact file, then "<path>.html" (clean URLs), then the app shell. */
function resolveFile(urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+$/, '') || '/';
  const candidates = clean === '/' ? ['index.html'] : [clean.slice(1), `${clean.slice(1)}.html`];
  for (const rel of candidates) {
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST)) return null; // no ../ escapes
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return file;
  }
  return path.join(DIST, 'index.html'); // client-side router shows the page (or the 404 page)
}

function startServer() {
  const server = http.createServer((req, res) => {
    const file = resolveFile(req.url || '/');
    if (!file) {
      res.writeHead(400).end();
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    });
    fs.createReadStream(file).pipe(res);
  });

  return new Promise((resolve, reject) => {
    const tryPort = (i) => {
      if (i >= PORTS.length) return reject(new Error('No free local port for FinTrack'));
      server.once('error', () => tryPort(i + 1));
      server.listen(PORTS[i], '127.0.0.1', () => resolve(PORTS[i]));
    };
    tryPort(0);
  });
}

let mainWindow = null;

function createWindow(origin) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 600,
    title: 'FinTrack',
    backgroundColor: '#f3f6f5',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Links to other sites (Firebase console, mailto, ...) open in the user's browser.
  const isInternal = (url) => url.startsWith(origin);
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!isInternal(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.loadURL(`${origin}${START_PATH}`);
}

// Keep app data in %APPDATA%FinTrack (Electron would otherwise use the npm package name).
app.setPath('userData', path.join(app.getPath('appData'), 'FinTrack'));

// One window only: a second launch focuses the existing one (and avoids a second port).
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    Menu.setApplicationMenu(null);
    const port = await startServer();
    createWindow(`http://localhost:${port}`);
  });

  app.on('window-all-closed', () => app.quit());
}
