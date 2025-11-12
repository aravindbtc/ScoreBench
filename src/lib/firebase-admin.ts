
import * as admin from 'firebase-admin';

// This function is designed to be safely called even if the environment variable is not set.
// It will only throw an error if the variable is missing AND the function is actually called.
function initializeAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
        throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. This is required for server-side Firebase operations.');
    }

    const parsedServiceAccount = JSON.parse(serviceAccount);
    const appName = 'firebase-admin-app-for-studio';

    if (admin.apps.some(a => a?.name === appName)) {
        return admin.app(appName);
    }
    
    return admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, appName);
}

// We wrap the initialization in a getter function.
// This prevents the error from being thrown on app startup if the admin app is not immediately needed.
export function getAdminApp() {
    // This will only be called by server actions that need it, like the failed upload attempt.
    return initializeAdminApp();
}
