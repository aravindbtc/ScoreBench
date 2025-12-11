
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Jury } from './types';
import { firebaseConfig } from '@/firebase/config';

// This function initializes the admin app, but only if it hasn't been initialized already
// in the current server instance. This is a robust pattern for serverless environments.
function getAdminApp(): App {
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
    
    // If not available or parsing failed, use Application Default Credentials.
    // This is a robust fallback for local development or properly configured cloud environments.
    return initializeApp({
        credential: applicationDefault(),
        databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
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


export async function deleteEvent(eventId: string): Promise<{ success: boolean, message: string }> {
    'use server';
    if (!eventId) {
        return { success: false, message: 'Event ID is required.' };
    }

    try {
        console.log(`[SERVER_ACTION] Initializing Admin SDK to delete event: ${eventId}`);
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);
        
        const eventRef = db.doc(`events/${eventId}`);
        
        console.log(`[SERVER_ACTION] Starting recursive delete for document: ${eventRef.path}`);
        
        await db.recursiveDelete(eventRef);

        console.log(`[SERVER_ACTION] Successfully deleted event and all subcollections: ${eventId}`);
        return { success: true, message: "Event deleted successfully." };

    } catch (error: any) {
        console.error(`[SERVER_ACTION] FAILED to delete event ${eventId}. Full error:`, error);
        // Return the specific error message for debugging on the client.
        return { success: false, message: `Deletion failed: ${error.message || 'An unknown server error occurred.'}` };
    }
}

