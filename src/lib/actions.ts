
'use server';

import { getAdminApp } from './firebase-admin';
import type { Jury } from './types';
import { query, where } from 'firebase-admin/firestore';


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
        const db = getAdminApp().firestore();
        const panelNumber = parseInt(panelNo, 10);
        const juriesCollectionRef = db.collection(`events/${eventId}/juries`);
        const q = query(juriesCollectionRef, where('panelNo', '==', panelNumber));
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


export async function deleteEvent(eventId: string) {
    'use server';
    if (!eventId) {
        return { success: false, message: 'Event ID is required.' };
    }

    try {
        console.log(`[SERVER ACTION] Initializing Admin App for event deletion: ${eventId}`);
        const adminApp = getAdminApp();
        const db = adminApp.firestore();
        const eventRef = db.doc(`events/${eventId}`);

        console.log(`[SERVER ACTION] Attempting to delete event document at path: ${eventRef.path}`);
        
        // Temporarily simplify to only delete the main document to isolate the issue.
        await eventRef.delete();

        /*
        // Original subcollection deletion logic (commented out for debugging)
        const batch = db.batch();
        const subcollections = ['teams', 'scores', 'juries', 'evaluationCriteria'];
        for (const sub of subcollections) {
            const subcollectionRef = db.collection(`events/${eventId}/${sub}`);
            const snapshot = await subcollectionRef.get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        batch.delete(eventRef);
        await batch.commit();
        */

        console.log(`[SERVER ACTION] Successfully deleted event document: ${eventId}`);
        return { success: true };

    } catch (error) {
        console.error(`[SERVER ACTION] FAILED to delete event ${eventId}. Full error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message: `Deletion failed: ${errorMessage}` };
    }
}
