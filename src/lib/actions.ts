'use server';

import { revalidatePath } from 'next/cache';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Team, Score } from './types';

export async function verifyAdminPassword(password: string) {
  'use server';
  if (password === 'VMRF@2025') {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
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

// Action to pre-populate Firebase with initial data for demonstration purposes
export async function seedInitialData() {
  'use server';
  try {
    // Seed Juries
    const juriesBatch = writeBatch(db);
    const juriesCollection = collection(db, 'juries');
    const juriesData = [
      { name: 'Panel 1', panelNo: 1 },
      { name: 'Panel 2', panelNo: 2 },
      { name: 'Panel 3', panelNo: 3 },
    ];
    // Check if juries exist
    const juriesSnapshot = await getDocs(juriesCollection);
    if (juriesSnapshot.empty) {
      juriesData.forEach((jury) => {
        const docRef = doc(juriesCollection, `jury-${jury.panelNo}`);
        juriesBatch.set(docRef, jury);
      });
      await juriesBatch.commit();
      console.log('Juries seeded.');
    } else {
      console.log('Juries collection not empty, skipping seed.');
    }

    // Seed Teams
    const teamsBatch = writeBatch(db);
    const teamsCollection = collection(db, 'teams');
    const teamsData = [
      { teamName: 'ByteBlaze', projectName: 'AI Health Tracker' },
      { teamName: 'DataWizards', projectName: 'Smart Waste Bin' },
      { teamName: 'QuantumLeap', projectName: 'Decentralized Social Network' },
      { teamName: 'InnovateAI', projectName: 'Real-time Translation Earbuds' },
    ];
    // Check if teams exist
    const teamsSnapshot = await getDocs(teamsCollection);
    if (teamsSnapshot.empty) {
      teamsData.forEach((team) => {
        const docRef = doc(teamsCollection);
        teamsBatch.set(docRef, team);
      });
      await teamsBatch.commit();
      console.log('Teams seeded.');
    } else {
      console.log('Teams collection not empty, skipping seed.');
    }
    
    return { success: true, message: "Initial data check/seed complete." };
  } catch (error) {
    console.error("Error seeding data:", error);
    return { success: false, message: "Failed to seed initial data." };
  }
}
