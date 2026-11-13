
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore'

/**
 * Initialise Firebase once. The Vite build is a static site, so the app is
 * configured from `firebaseConfig` (Firebase App Hosting auto-config, which the
 * Next.js version relied on, does not apply to static hosting).
 */
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  // If already initialized, return the SDKs with the already initialized App
  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getCachedFirestore(firebaseApp)
  };
}

/**
 * Firestore with an IndexedDB cache shared across tabs: repeat visits render
 * cached data instantly while fresh data streams in. Falls back to the default
 * in-memory instance if it was already initialised or IndexedDB is unavailable.
 */
function getCachedFirestore(firebaseApp: FirebaseApp): Firestore {
  if (typeof window === 'undefined') return getFirestore(firebaseApp);
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch {
    return getFirestore(firebaseApp);
  }
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
