
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Jury } from './types';

// This function is self-contained and should only be used within this server actions file.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (!serviceAccountEnv) {
        // Fallback for environments like Google Cloud Run where ADC is available.
        try {
            console.log("Initializing Firebase Admin with Application Default Credentials...");
            return initializeApp({
                credential: applicationDefault(),
            });
        } catch (e) {
            console.error("CRITICAL: FIREBASE_SERVICE_ACCOUNT is not set and Application Default Credentials are not available.", e);
            throw new Error('Server is not configured with admin credentials. The FIREBASE_SERVICE_ACCOUNT environment variable is missing.');
        }
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(serviceAccountEnv);
        // This is the critical fix: Replace escaped \\n with literal \n for the private key.
        if (serviceAccount.private_key) {
            serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
        }
    } catch (e: any) {
        if (e instanceof SyntaxError) {
            console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT. The environment variable is likely not a valid, single-line JSON string.', e);
            throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON. Please ensure it is a single-line, escaped string.');
        }
         // This specifically catches the "Invalid PEM" error and provides a clearer message.
        if (e.message.includes('PEM')) {
            console.error('CRITICAL: Failed to parse private key. The format is invalid.', e);
            throw new Error(`Failed to parse private key: ${e.message}`);
        }
        throw e; // Re-throw other errors
    }
    
    console.log("Initializing Firebase Admin with corrected Service Account...");
    return initializeApp({
        credential: cert(serviceAccount),
    });
}


export async function verifyAdminPassword(password: string) {
  'use server';
  if (password === process.env.ADMIN_PASSWORD) {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
}


export async function verifyJuryPassword(eventId: string, panelNo: string, password:string) {
    'use server';
    try {
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);
        const panelNumber = parseInt(panelNo, 10);
        const juriesCollectionRef = db.collection(`events/${eventId}/juries`);
        const q = juriesCollectionRef.where('panelNo', '==', panelNumber);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return { success: false, message: 'Invalid panel selected for this event.' };
        }

        const juryDoc = querySnapshot.docs[0];
        const juryData = juryDoc.data() as Jury;

        if (juryData.password === password) {
            return { success: true };
        } else {
            return { success: false, message: 'Incorrect password for the selected panel.' };
        }
    } catch (error: any) {
        console.error("[JURY_AUTH_ERROR]", error);
        return { success: false, message: `An unexpected error occurred during login: ${error.message}` };
    }
}


export async function deleteEvent(eventId: string): Promise<{ success: boolean; message: string }> {
    'use server';
    if (!eventId) {
        return { success: false, message: 'Event ID is required.' };
    }

    try {
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);
        
        const eventRef = db.doc(`events/${eventId}`);
        console.log(`Starting recursive deletion for event: ${eventRef.path}`);
        
        await db.recursiveDelete(eventRef);
        console.log(`Successfully deleted event: ${eventId}`);

        return { success: true, message: "Event deleted successfully." };

    } catch (error: any) {
        console.error(`[SERVER_ACTION_ERROR] Failed to delete event ${eventId}:`, error);
        const errorMessage = error.message || 'An unknown server error occurred during deletion.';
        return { success: false, message: errorMessage };
    }
}
