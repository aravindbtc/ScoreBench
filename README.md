# ScoreBench - Hackathon & Competition Evaluation System

ScoreBench is a - **Dual-Role Authentication**: Secure, password-protected login portals for both **Admins** and **Jury Members**.
modern, real-time evaluation platform designed to streamline the judging process for hackathons, ideathons, and other competitions. It provides a robust, easy-to-use interface for both administrators and jury members, backed by a powerful and scalable serverless architecture.

## ✨ Key Features

- **Dual-Role Authentication**: Secure, password-protected login portals for both **Admins** and **Jury Members**.
- **Comprehensive Admin Dashboard**:
    - **Team Management**: Manually add or bulk-upload teams via JSON.
    - **Jury Management**: Create and manage jury panels with unique passwords.
    - **Dynamic Criteria Control**: Admins can define, edit, enable/disable, and set maximum scores for each evaluation criterion, making the app adaptable for any event.
    - **Real-time Leaderboard**: View a live, sortable leaderboard of all teams with their average scores.
    - **Detailed Score Breakdown**: Drill down into any team's scores to see detailed feedback and scores from each panel.
- **Intuitive Jury Dashboard**:
    - **Alphabetized Team List**: Juries can easily find teams to evaluate.
    - **Dynamic Scoring Form**: The scoring form automatically generates based on the active criteria set by the admin.
    - **Real-time Updates**: Submit or update scores and see the changes reflected instantly.
- **AI-Powered Feedback Generation**:
    - Leverages Genkit and Google's Gemini models to automatically generate a consolidated feedback summary for each team based on remarks from all jury panels.
- **Customization & Data Portability**:
    - **Customizable Login Page**: Admins can upload a custom background image for the login screen.
    - **Export to Excel**: Easily export all team scores and feedback into a `.xlsx` file for archival and analysis.
- **Modern Tech Stack**: Built with best practices using a type-safe, component-based, and serverless-first approach.

## 🚀 Technology Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI**: [React](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Component Library**: [ShadCN UI](https://ui.shadcn.com/)
- **Database & Auth**: [Firebase](https://firebase.google.com/) (Firestore & Firebase Authentication)
- **Generative AI**: [Genkit (by Firebase)](https://firebase.google.com/docs/genkit) with Google Gemini
- **Image Hosting**: [ImageKit](https://imagekit.io/) for optimized background image delivery.
- **Deployment**: Ready for Vercel or Firebase App Hosting.

## 🔧 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project with Firestore and Authentication enabled.
- An ImageKit account.

### Environment Variables

Before running the application, you need to set up your environment variables. Create a file named `.env.local` in the root of the project and add the following variables:

```bash
# The password for the main administrator account.
ADMIN_PASSWORD="your_super_secret_admin_password"

# --- ImageKit Credentials ---
# Found in your ImageKit dashboard under Developer -> API Keys
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY="your_imagekit_public_key"
IMAGEKIT_PRIVATE_KEY="your_imagekit_private_key"
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT="https://ik.imagekit.io/your_imagekit_id"

# --- Genkit / Google AI Credentials ---
# A Google AI API key for Gemini model access
GEMINI_API_KEY="your_google_ai_api_key"
```

**Important**: The Firebase configuration is stored in `src/firebase/config.ts` and is automatically handled by the Firebase Studio environment.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Run the development server:
    ```bash
    npm run dev
    ```

The application will be available at `http://localhost:3000`.

## 📁 Project Structure

```
.
├── src
│   ├── app                 # Next.js App Router pages (Admin, Jury, Login)
│   ├── components          # Reusable React components (UI, Auth, Layouts)
│   ├── ai                  # Genkit flows for AI features
│   ├── firebase            # Firebase configuration, hooks, and providers
│   ├── hooks               # Custom React hooks
│   ├── lib                 # Core logic, types, actions, and utilities
│   └── public              # Static assets (icons, images)
├── docs
│   └── backend.json        # Schema definition for Firestore entities
├── firestore.rules         # Security rules for the database
└── ...                     # Configuration files (Next.js, Tailwind, etc.)
```

This should give you a great overview of the ScoreBench project. Let me know if you'd like any other details added!
