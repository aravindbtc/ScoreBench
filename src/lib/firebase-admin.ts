
import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { firebaseConfig } from '@/firebase/config';

// This file is for SERVER-SIDE use only.

// IMPORTANT: The service account is automatically injected by the environment.
// You do not need to provide a service account file.

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }
  
  const credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!));

  return initializeApp({
    credential,
    databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}

const app: App = getAdminApp();
const db: Firestore = getFirestore(app);

export { app, db };
