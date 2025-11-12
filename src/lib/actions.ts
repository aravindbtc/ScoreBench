
'use server';

import { revalidatePath } from 'next/cache';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  getDoc,
  FirestoreError,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Team, Score, ImagePlaceholder, Jury } from './types';
import { PlaceHolderImages } from './placeholder-images';

export async function verifyAdminPassword(password: string) {
  'use server';
  if (password === 'VMRF@2025') {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
}

export async function updateLoginBackground(imageUrl: string) {
  'use server';
  try {
    const configDocRef = doc(db, 'appConfig', 'loginBackground');
    await setDoc(configDocRef, { imageUrl }, { merge: true });
    
    // Revalidate paths to ensure the new background is fetched on next load
    revalidatePath('/admin/upload-image');
    revalidatePath('/');
    
    return { success: true, message: 'Background updated successfully.' };
  } catch (error) {
    const message = error instanceof Error ? error.message : "An unknown error occurred while updating the background.";
    return { success: false, message };
  }
}

export async function addJury(jury: Omit<Jury, 'id'>) {
  'use server';
  try {
    const juriesCollection = collection(db, 'juries');
    // Check if panel number already exists
    const q = query(juriesCollection, where('panelNo', '==', jury.panelNo));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return { success: false, message: `Panel number ${jury.panelNo} already exists.` };
    }
    await addDoc(juriesCollection, jury);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, message: `Jury "${jury.name}" added successfully.` };
  } catch (error) {
    console.error('Error adding jury:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to add jury: ${errorMessage}` };
  }
}

export async function deleteJury(juryId: string) {
  'use server';
  try {
    const juryDocRef = doc(db, 'juries', juryId);
    await deleteDoc(juryDocRef);
    revalidatePath('/admin');
    revalidatePath('/');
    return { success: true, message: 'Jury deleted successfully.' };
  } catch (error) {
    console.error('Error deleting jury:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete jury: ${errorMessage}` };
  }
}

export async function addTeam(team: Omit<Team, 'id'>) {
  'use server';
  try {
    const teamsCollection = collection(db, 'teams');
    await addDoc(teamsCollection, team);
    revalidatePath('/admin');
    return { success: true, message: `Team "${team.teamName}" added successfully.` };
  } catch (error) {
    console.error('Error adding team:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to add team: ${errorMessage}` };
  }
}

export async function deleteTeam(teamId: string) {
  'use server';
  try {
    const batch = writeBatch(db);
    
    // Delete the team document
    const teamDocRef = doc(db, 'teams', teamId);
    batch.delete(teamDocRef);

    // Delete the corresponding scores document
    const scoreDocRef = doc(db, 'scores', teamId);
    batch.delete(scoreDocRef);
    
    await batch.commit();

    revalidatePath('/admin');
    revalidatePath('/jury');
    return { success: true, message: 'Team and associated scores deleted.' };
  } catch (error) {
    console.error('Error deleting team:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to delete team: ${errorMessage}` };
  }
}

export async function uploadTeams(teams: Omit<Team, 'id'>[]) {
  'use server';
  try {
    const batch = writeBatch(db);
    const teamsCollection = collection(db, 'teams');

    teams.forEach((team) => {
      const docRef = doc(teamsCollection);
      batch.set(docRef, {
        teamName: team.teamName,
        projectName: team.projectName,
      });
    });

    await batch.commit();
    revalidatePath('/admin/upload');
    revalidatePath('/admin');
    revalidatePath('/jury');
    return { success: true, message: `${teams.length} teams uploaded successfully.` };
  } catch (error) {
    console.error('Error uploading teams:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Upload failed: ${errorMessage}` };
  }
}

export async function submitScore(
  teamId: string,
  panelNo: number,
  scoreData: Score
) {
  'use server';
  try {
    const scoreDocRef = doc(db, 'scores', teamId);
    const panelField = `panel${panelNo}`;

    await setDoc(scoreDocRef, { [panelField]: scoreData }, { merge: true });

    // Recalculate average
    const updatedDocSnap = await getDoc(scoreDocRef);
    if (updatedDocSnap.exists()) {
      const data = updatedDocSnap.data();
      let total = 0;
      let panelCount = 0;
      if (data.panel1) {
        total += data.panel1.total;
        panelCount++;
      }
      if (data.panel2) {
        total += data.panel2.total;
        panelCount++;
      }
      if (data.panel3) {
        total += data.panel3.total;
        panelCount++;
      }

      const avgScore = panelCount > 0 ? total / panelCount : 0;
      await setDoc(scoreDocRef, { avgScore }, { merge: true });
    }

    revalidatePath('/jury');
    revalidatePath('/admin');
    return { success: true, message: 'Score submitted successfully.' };
  } catch (error) {
    console.error('Error submitting score:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Submission failed: ${errorMessage}` };
  }
}
