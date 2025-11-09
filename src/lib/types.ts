
export interface Team {
  id: string;
  teamName: string;
  projectName: string;
}

export interface Jury {
  id: string;
  name: string;
  panelNo: number;
}

export interface Score {
  innovation: number;
  relevance: number;
  technical: number;
  presentation: number;
  feasibility: number;
  total: number;
  remarks: string;
  aiFeedback?: string;
}

export interface TeamScores {
  id: string; // Corresponds to teamId
  panel1?: Score;
  panel2?: Score;
  panel3?: Score;
  avgScore?: number;
}

export interface CombinedScoreData extends Team {
  scores: TeamScores;
}

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};
