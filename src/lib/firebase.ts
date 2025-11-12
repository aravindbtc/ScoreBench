
import { initializeFirebase } from './firebase-client';
import { firebaseConfig as config } from '@/firebase/config';

const { app, auth, db, storage } = {
  ...initializeFirebase(),
  storage: null, // No storage is initialized in initializeFirebase, so explicitly set to null.
};

// Re-export firebaseConfig for any parts of the app that might still reference it directly.
export const firebaseConfig = config;

export { app, auth, db, storage };
