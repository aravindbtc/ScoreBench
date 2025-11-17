
export interface Team {
  id: string;
  teamName: string;
  projectName: string;
}

export interface Jury {
  id: string;
  name: string;
  panelNo: number;
  password?: string;
}

export interface Score {
  // scores will be a map of criterion keys to numbers, e.g., { innovation: 8, relevance: 9 }
  scores: { [key: string]: number };
  total: number;
  remarks: string;
  aiFeedback?: string;
  maxScore: number;
}

export interface TeamScores {
  id: string; // Corresponds to teamId
  panel1?: Score;
  panel2?: Score;
  panel3?: Score;
  avgScore?: number;
  consolidatedFeedback?: string;
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

export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  active: boolean;
  maxScore: number;
}
