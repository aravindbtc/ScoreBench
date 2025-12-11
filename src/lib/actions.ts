
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Jury } from './types';


// This function initializes the admin app, but only if it has been initialized already
// in the current server instance. This is a robust pattern for serverless environments.
function getAdminApp(): App {
    if (getApps().length > 0) {
        return getApp();
    }

    const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    if (serviceAccountEnv) {
        let serviceAccount;
        try {
            serviceAccount = JSON.parse(serviceAccountEnv);
        } catch (e: any) {
            if (e instanceof SyntaxError) {
                console.error('CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT. The environment variable is likely not a valid, single-line JSON string.');
                throw new Error('The FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON. Please ensure it is a single-line, escaped string.');
            }
            throw e; // Re-throw other errors
        }
        
        return initializeApp({
            credential: cert(serviceAccount),
        });
    } 
    
    console.log("Initializing Firebase Admin with Application Default Credentials.");
    return initializeApp({
        credential: applicationDefault(),
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
        
        await db.recursiveDelete(eventRef);

        return { success: true, message: "Event deleted successfully." };

    } catch (error: any) {
        console.error(`[SERVER_ACTION_ERROR] Failed to delete event ${eventId}:`, error);
        
        // Default error message
        let errorMessage = 'An unknown server error occurred during deletion.';
        
        // Provide more specific feedback if possible
        if (error.message) {
            errorMessage = error.message;
        }
        
        return { success: false, message: `Deletion failed: ${errorMessage}` };
    }
}
