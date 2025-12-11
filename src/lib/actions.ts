
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Jury } from './types';


export async function verifyAdminPassword(password: string) {
  'use server';
  if (password === process.env.ADMIN_PASSWORD) {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
}


export async function verifyJuryPassword(eventId: string, panelNo: string, password: string) {
    'use server';
    try {
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
