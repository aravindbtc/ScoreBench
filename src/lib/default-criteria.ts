
import type { EvaluationCriterion } from "./types";

// The default set of criteria. The IDs should be simple strings for Firestore path safety.
export const defaultCriteria: EvaluationCriterion[] = [
    {
      "id": "innovation",
      "name": "Innovation & Originality",
      "description": "Is the idea genuinely new or a meaningful improvement over existing solutions?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "problem_understanding",
      "name": "Problem Understanding & Relevance",
      "description": "Does the team clearly understand the problem they’re solving, and is the solution relevant?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "technical_implementation",
      "name": "Technical Implementation",
      "description": "How well is the technology built? Is it a working prototype with actual functionality?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "complexity",
      "name": "Complexity & Technical Challenge",
      "description": "Did the team tackle difficult technical problems or take an easy route? Depth of engineering effort.",
      "active": false,
      "maxScore": 10
    },
    {
      "id": "ux_design",
      "name": "User Experience & Design",
      "description": "UI clarity, usability, and clean flow. Does it feel like an actual product?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "impact",
      "name": "Impact & Feasibility",
      "description": "Will this solution make a real-world difference? Is it realistically buildable beyond the hackathon?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "presentation",
      "name": "Presentation & Demo Quality",
      "description": "Was the demo smooth and convincing? Did the team explain the idea sharply?",
      "active": true,
      "maxScore": 10
    },
    {
      "id": "collaboration",
      "name": "Team Collaboration & Execution",
      "description": "Did the team divide tasks well and execute efficiently? Evidence of teamwork.",
      "active": false,
      "maxScore": 10
    },
    {
        "id": "problem_definition",
        "name": "Problem Definition",
        "description": "How well is the problem defined and articulated by the team?",
        "active": true,
        "maxScore": 10
    },
    {
        "id": "solution_correctness",
        "name": "Solution Correctness",
        "description": "Does the solution correctly and effectively solve the defined problem?",
        "active": true,
        "maxScore": 10
    },
    {
        "id": "feasibility",
        "name": "Feasibility",
        "description": "Is the proposed solution practical and achievable within reasonable constraints?",
        "active": true,
        "maxScore": 10
    },
    {
        "id": "originality",
        "name": "Originality",
        "description": "How original and creative is the solution? Does it bring a new perspective?",
        "active": true,
        "maxScore": 10
    },
    {
        "id": "questions",
        "name": "Q&A Handling",
        "description": "How well did the team handle questions from the jury?",
        "active": true,
        "maxScore": 10
    }
  ];

