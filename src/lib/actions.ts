
'use server';

import { initializeApp, getApps, getApp, cert, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import type { Jury } from './types';
import { firebaseConfig } from '@/firebase/config';


// Helper function to initialize the admin app on-demand.
// This is the robust way to handle initialization in a serverless environment.
function getAdminApp() {
    if (getApps().length > 0) {
        return getApp();
    }

    let serviceAccount;
    try {
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
             return initializeApp({
                credential: cert(serviceAccount),
                databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
            });
        } else {
            // This is a fallback for local development or environments
            // where application default credentials should be used.
            console.warn("[ADMIN_SDK] FIREBASE_SERVICE_ACCOUNT env var not set. Falling back to default credentials.");
             return initializeApp({
                credential: applicationDefault(),
                databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
            });
        }
    } catch (e) {
        console.error('[ADMIN_SDK] Error initializing Firebase Admin SDK. Falling back to default credentials.', e);
        return initializeApp({
            credential: applicationDefault(),
            databaseURL: `https://{firebaseConfig.projectId}.firebaseio.com`
        });
    }
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
    } catch (error) {
        console.error("[JURY_AUTH_ERROR]", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message: `An unexpected error occurred during login: ${errorMessage}` };
    }
}


export async function deleteEvent(eventId: string): Promise<{ success: boolean, message?: string }> {
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
        return { success: true };

    } catch (error: any) {
        console.error(`[SERVER_ACTION] FAILED to delete event ${eventId}. Full error:`, error);
        // Return the specific error message for debugging on the client.
        return { success: false, message: `Deletion failed: ${error.message || 'An unknown server error occurred.'}` };
    }
}
