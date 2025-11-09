
'use server';

import { revalidatePath } from 'next/cache';
import {
  collection,
  doc,
  writeBatch,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Team, Score, ImagePlaceholder } from './types';
import { PlaceHolderImages } from './placeholder-images';

export async function verifyAdminPassword(password: string) {
  'use server';
  if (password === 'VMRF@2025') {
    return { success: true };
  }
  return { success: false, message: 'Incorrect password.' };
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

export async function getLoginBackground(): Promise<ImagePlaceholder> {
  try {
    const configDocRef = doc(db, 'appConfig', 'loginBackground');
    const docSnap = await getDoc(configDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as ImagePlaceholder;
    }
  } catch (error) {
    console.error("Error fetching login background from Firestore:", error);
  }
  // Fallback to the default from JSON file
  return PlaceHolderImages.find((img) => img.id === 'login-background')!;
}


export async function updateLoginBackground(data: { imageUrl: string }) {
  'use server';
  try {
    const configDocRef = doc(db, 'appConfig', 'loginBackground');
    await updateDoc(configDocRef, { imageUrl: data.imageUrl });
    revalidatePath('/');
    return { success: true, message: 'Login background updated successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return { success: false, message: `Failed to update: ${errorMessage}` };
  }
}


// Action to pre-populate Firebase with initial data for demonstration purposes
export async function seedInitialData() {
  'use server';
  try {
    const batch = writeBatch(db);

    // Seed Juries
    const juriesCollection = collection(db, 'juries');
    const juriesData = [
      { name: 'Panel 1', panelNo: 1 },
      { name: 'Panel 2', panelNo: 2 },
      { name: 'Panel 3', panelNo: 3 },
    ];
    const juriesSnapshot = await getDocs(juriesCollection);
    if (juriesSnapshot.empty) {
      juriesData.forEach((jury) => {
        const docRef = doc(juriesCollection, `jury-${jury.panelNo}`);
        batch.set(docRef, jury);
      });
    }

    // Seed Teams
    const teamsCollection = collection(db, 'teams');
    const teamsData = [
      { teamName: 'ByteBlaze', projectName: 'AI Health Tracker' },
      { teamName: 'DataWizards', projectName: 'Smart Waste Bin' },
      { teamName: 'QuantumLeap', projectName: 'Decentralized Social Network' },
      { teamName: 'InnovateAI', projectName: 'Real-time Translation Earbuds' },
    ];
    const teamsSnapshot = await getDocs(teamsCollection);
    if (teamsSnapshot.empty) {
      teamsData.forEach((team) => {
        const docRef = doc(teamsCollection);
        batch.set(docRef, team);
      });
    }

    // Seed App Config
    const loginBgConfigRef = doc(db, 'appConfig', 'loginBackground');
    const loginBgConfigSnap = await getDoc(loginBgConfigRef);
    if (!loginBgConfigSnap.exists()) {
      const defaultBg = PlaceHolderImages.find((img) => img.id === 'login-background');
      if (defaultBg) {
        batch.set(loginBgConfigRef, defaultBg);
      }
    }
    
    await batch.commit();

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true, message: "Initial data check/seed complete." };
  } catch (error) {
    console.error("Error seeding data:", error);
    return { success: false, message: "Failed to seed initial data." };
  }
}
