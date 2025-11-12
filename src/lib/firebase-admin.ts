
import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;

if (!serviceAccount) {
    throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not set. Please add it to your .env file.');
}

const parsedServiceAccount = JSON.parse(serviceAccount);

const appName = 'firebase-admin-app-for-studio';

let app: admin.app.App;

if (admin.apps.some(a => a?.name === appName)) {
    app = admin.app(appName);
} else {
    app = admin.initializeApp({
        credential: admin.credential.cert(parsedServiceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
    }, appName);
}

export function getAdminApp() {
    return app;
}
