/**
 * Bill pictures. There is no file storage bucket, so an uploaded image is shrunk in the
 * browser to a small square thumbnail and saved inside the bill as a data URL (a few KB).
 * A link is saved as-is, but only https links are accepted (http images are blocked on a
 * secure page, and other schemes are not images).
 */

export const BILL_IMAGE_SIZE = 128;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/** True for an https image link or one of our own thumbnails. */
export function isAllowedBillImage(value: string | undefined | null): value is string {
  if (!value) return false;
  if (/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value)) return value.length < 200_000;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && value.length <= 2048;
  } catch {
    return false;
  }
}

/** Load an image element from a URL; rejects if the browser cannot show it. */
export function probeImage(src: string, timeoutMs = 8000): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error('error'));
    };
    img.referrerPolicy = 'no-referrer';
    img.src = src;
  });
}

/**
 * Crop the file to a centred square, scale it to 128x128 and encode it (WebP, or JPEG where
 * WebP encoding is unavailable). Throws a message suitable for showing to the user.
 */
export async function resizeBillImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (PNG, JPG, WebP, GIF or SVG).');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('That image is over 8 MB. Choose a smaller one.');

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    img.src = objectUrl;
    try {
      await img.decode();
    } catch {
      throw new Error('This image could not be opened. Try a PNG or JPG.');
    }
    const w = img.naturalWidth || BILL_IMAGE_SIZE;
    const h = img.naturalHeight || BILL_IMAGE_SIZE;
    const side = Math.min(w, h);
    const canvas = document.createElement('canvas');
    canvas.width = BILL_IMAGE_SIZE;
    canvas.height = BILL_IMAGE_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Your browser could not process this image.');
    ctx.fillStyle = '#ffffff'; // transparent logos get a white tile instead of black in JPEG
    ctx.fillRect(0, 0, BILL_IMAGE_SIZE, BILL_IMAGE_SIZE);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, (w - side) / 2, (h - side) / 2, side, side, 0, 0, BILL_IMAGE_SIZE, BILL_IMAGE_SIZE);
    const webp = canvas.toDataURL('image/webp', 0.85);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
