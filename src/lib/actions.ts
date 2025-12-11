
'use server';

import { getAdminApp } from './firebase-admin';
import type { Jury } from './types';
import { CollectionReference, Query, WriteBatch } from 'firebase-admin/firestore';


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
        const db = adminApp.firestore();
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


async function deleteCollection(collectionRef: CollectionReference | Query, batch: WriteBatch): Promise<void> {
    const snapshot = await collectionRef.get();
    if (snapshot.size === 0) {
        return;
    }

    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
}

export async function deleteEvent(eventId: string): Promise<{ success: boolean, message?: string }> {
    'use server';
    if (!eventId) {
        return { success: false, message: 'Event ID is required.' };
    }

    try {
        console.log(`[SERVER ACTION] Deleting event: ${eventId}`);
        const adminApp = getAdminApp();
        const db = adminApp.firestore();
        
        const eventRef = db.doc(`events/${eventId}`);
        const batch = db.batch();

        // Target all subcollections for deletion
        const subcollections = ['teams', 'scores', 'juries', 'evaluationCriteria'];
        for (const subcollection of subcollections) {
            const collectionPath = `${eventRef.path}/${subcollection}`;
            console.log(`[SERVER ACTION] Deleting subcollection: ${collectionPath}`);
            const subcollectionRef = db.collection(collectionPath);
            await deleteCollection(subcollectionRef, batch);
        }

        // Delete the main event document
        console.log(`[SERVER ACTION] Deleting main event document: ${eventRef.path}`);
        batch.delete(eventRef);

        // Commit the batch
        await batch.commit();

        console.log(`[SERVER ACTION] Successfully deleted event and all subcollections: ${eventId}`);
        return { success: true };

    } catch (error) {
        console.error(`[SERVER ACTION] FAILED to delete event ${eventId}. Full error:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message: `Deletion failed: ${errorMessage}` };
    }
}
