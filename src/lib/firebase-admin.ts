
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { firebaseConfig } from '@/firebase/config';

// This file is for SERVER-SIDE use only.

// IMPORTANT: The service account is automatically injected by the environment.
// You do not need to provide a service account file.

export function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApp();
  }

  // Check if the service account environment variable is available.
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        return initializeApp({
            credential: cert(serviceAccount),
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
        });
    } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT. Falling back to default credentials.', e);
        // Fall through to default credentials if parsing fails
    }
  } 
  
  // If not available (e.g., local development without the variable set),
  // use Application Default Credentials. This is a robust fallback.
  return initializeApp({
      credential: applicationDefault(),
      databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
  });
}
