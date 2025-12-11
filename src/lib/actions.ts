
'use server';

import { initializeApp, getApps, getApp, cert, App } from 'firebase-admin/app';
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
        } else {
            // This is a fallback for local development or environments
            // where application default credentials should be used.
            console.warn("FIREBASE_SERVICE_ACCOUNT env var not set. Falling back to default credentials. This is expected for local development.");
             return initializeApp({
                databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
            });
        }
    } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT. Falling back to default credentials.', e);
        return initializeApp({
            databaseURL: `https://${firebaseConfig.projectId}.firebaseio.com`
        });
    }
    
    return initializeApp({
        credential: cert(serviceAccount),
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
    } catch (error) {
        console.error("Jury password verification failed:", error);
        return { success: false, message: 'An unexpected error occurred during login.' };
    }
}


export async function deleteEvent(eventId: string): Promise<{ success: boolean, message?: string }> {
    'use server';
    if (!eventId) {
        return { success: false, message: 'Event ID is required.' };
    }

    try {
        console.log(`[SERVER ACTION] Initializing Admin SDK to delete event: ${eventId}`);
        const adminApp = getAdminApp();
        const db = getFirestore(adminApp);
        
        const eventRef = db.doc(`events/${eventId}`);
        
        console.log(`[SERVER ACTION] Starting recursive delete for document: ${eventRef.path}`);
        
        // Use the built-in recursiveDelete method.
        // This is the most efficient and reliable way to delete a document and all its subcollections.
        await db.recursiveDelete(eventRef);

        console.log(`[SERVER ACTION] Successfully deleted event and all subcollections: ${eventId}`);
        return { success: true };

    } catch (error) {
        console.error(`[SERVER ACTION] FAILED to delete event ${eventId}. Full error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message: `Deletion failed: ${errorMessage}` };
    }
}
