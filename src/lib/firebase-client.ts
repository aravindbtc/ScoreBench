
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
  storage: FirebaseStorage;
} {
  if (getApps().length) {
    const app = getApp();
    return getSdks(app);
  }

  let firebaseApp;
  try {
    firebaseApp = initializeApp();
  } catch (e) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
    }
    firebaseApp = initializeApp(firebaseConfig);
  }

  return getSdks(firebaseApp);
}

function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp),
  };
}
