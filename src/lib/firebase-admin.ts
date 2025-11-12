
import * as admin from 'firebase-admin';

// This function is designed to be safely called even if the environment variable is not set.
// It will only throw an error if the variable is missing AND the function is actually called.
function initializeAdminApp() {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

    if (!serviceAccount) {
        // This error should guide the user to set up the environment variable.
        // It's critical for any server-side Firebase Admin operations.
        throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please add it to your .env file.');
    }

    // Safeguard against malformed JSON
    let parsedServiceAccount;
    try {
        parsedServiceAccount = JSON.parse(serviceAccount);
    } catch (e) {
        throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON.');
    }

    const appName = 'firebase-admin-app-for-studio';

    // Return the existing app if it has already been initialized
    const existingApp = admin.apps.find(a => a?.name === appName);
    if (existingApp) {
        return existingApp;
    }
    
    // Initialize the new app
    return admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, appName);
}

let adminApp: admin.app.App | null = null;

// We wrap the initialization in a getter function.
// This prevents the error from being thrown on app startup if the admin app is not immediately needed.
// It also ensures we only initialize the app once (singleton pattern).
export function getAdminApp() {
    if (!adminApp) {
        adminApp = initializeAdminApp();
    }
    return adminApp;
}

    