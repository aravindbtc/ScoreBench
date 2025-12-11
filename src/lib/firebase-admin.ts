
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// This file is for SERVER-SIDE use only.

// IMPORTANT: The service account is automatically injected by the environment.
// You do not need to provide a service account file.

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Check if the service account environment variable is available.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT));
    return initializeApp({
      credential,
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
  } else {
    // If not available (e.g., local development without the variable set),
    // use Application Default Credentials. This is a robust fallback.
    return initializeApp({
        credential: applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
    });
  }
}

let db: Firestore;

try {
    const app: App = getAdminApp();
    db = getFirestore(app);
} catch (e) {
    console.error("Firebase Admin SDK initialization failed:", e);
    // Create a mock db object to avoid crashing the app if initialization fails
    db = {} as Firestore;
}

// Do not export db directly to comply with "use server" module rules.
// It will be imported directly by other server files.
export { db };
