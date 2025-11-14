
'use server';

import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import type { Jury } from './types';


export async function verifyAdminPassword(password: string) {
  'use server';
  // This is a simple check. In a real-world scenario, you'd use a more secure
  // method, potentially involving a database or a secure secret management service.
  if (password === 'VMRF@2025') {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
}


export async function verifyJuryPassword(panelNo: string, password: string) {
    'use server';
    try {
        const panelNumber = parseInt(panelNo, 10);
        const juriesCollection = collection(db, 'juries');
        const q = query(juriesCollection, where('panelNo', '==', panelNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, message: 'Invalid panel selected.' };
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
