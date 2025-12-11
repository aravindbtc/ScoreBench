
'use server';

import { getFirestore } from 'firebase-admin/firestore';
import { getAdminApp } from './firebase-admin';
import { collection, getDocs, query, where, doc, writeBatch } from 'firebase/firestore';
import type { Jury } from './types';


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
        const db = getFirestore(getAdminApp());
        const panelNumber = parseInt(panelNo, 10);
        const juriesCollection = collection(db, `events/${eventId}/juries`);
        const q = query(juriesCollection, where('panelNo', '==', panelNumber));
        const querySnapshot = await getDocs(q);

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
        const db = getFirestore(getAdminApp());
        const eventRef = doc(db, 'events', eventId);
        const batch = writeBatch(db);

        const subcollections = ['teams', 'scores', 'juries', 'evaluationCriteria'];
        for (const sub of subcollections) {
            const subcollectionRef = collection(eventRef, sub);
            const snapshot = await getDocs(subcollectionRef);
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        batch.delete(eventRef);

        await batch.commit();

        return { success: true };

    } catch (error) {
        console.error(`Failed to delete event ${eventId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown server error occurred.';
        return { success: false, message: `An unexpected error occurred while deleting the event: ${errorMessage}` };
    }
}
