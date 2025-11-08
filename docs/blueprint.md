# **App Name**: HackEval

## Core Features:

- Jury Login: Allow jury members to log in as guests using Firebase Anonymous Auth.
- Team Evaluation: Enable judges to view a list of teams and submit scores based on 5 criteria (Innovation, Relevance, Technical Implementation, Presentation & Communication, Scalability & Feasibility) using sliders.
- Score Submission: Save the individual jury member's scores to Firestore under /scores/{team}/{panel}.
- Real-time Average Score Calculation: Automatically calculate and update the average score for each team in Firestore whenever new scores are submitted.
- Admin Dashboard: Provide an admin dashboard for viewing all teams and their scores, with real-time updates.
- Team Data Upload: Allow the admin to upload team data from a JSON file to Firestore.
- AI-Powered Scoring Insights (Bonus): Use an LLM tool, incorporating Jury’s numeric scores as its input and outputting one-line feedback (e.g., "Strong implementation but limited novelty."). Store feedback in Firestore.

## Style Guidelines:

- Primary color: Cyan (#38BDF8) for a tech-focused aesthetic.
- Background color: Dark blue (#0B1120) for a modern, tech-themed appearance.
- Accent color: A lighter analogous blue (#6EE7B7) for highlights and active elements, providing a visually accessible contrast against the darker theme.
- Body and headline font: 'Inter' sans-serif for a modern and clean user interface. Note: currently only Google Fonts are supported.
- Use Material UI icons for a consistent and recognizable visual language.
- Implement a sidebar for navigation (Teams, Scores, Upload) and a top bar with the logo 'HackEval'. Ensure a responsive design for mobile and tablets.
- Add subtle transitions and animations to improve the user experience.