# ScoreBench - User Manual

## 1. Introduction

Welcome to ScoreBench! This guide will walk you through all the features of the application for both the **Administrator** and **Jury** roles. ScoreBench is designed to make the evaluation process for competitions like hackathons and ideathons seamless, real-time, and efficient.

---

## 2. The Login & Welcome Experience

Your journey begins at the welcome page, which provides a clean entry point into the application.

### 2.1. Pre-Landing Page (`/`)



This is the first screen every user sees. It displays the app name, a brief description, and a "Get Started" button.

- **Action**: Click **"Get Started"** to proceed to the role selection page.
- **Customization**: The background for this page can be changed by the Admin (See Section 3.2.3).

### 2.2. Role Selection Page (`/login`)



This page allows you to identify as either a Jury member or an Administrator.

- **Jury Path**:
    1.  The "Jury" tab is selected by default.
    2.  Use the **"Select Event"** dropdown to choose the competition you are judging.
    3.  Once you select an event, you will be automatically redirected to that event's specific Jury Panel Login page.

- **Admin Path**:
    1.  Click the **"Admin"** tab.
    2.  Enter the master **Admin Password**.
    3.  Click **"Login as Admin"** to access the Admin Event Hub.

- **Customization**: The background for this page can also be changed by the Admin (See Section 3.2.3).

### 2.3. Jury Panel Login Page (`/login/[eventId]`)



After a Jury member selects an event, they land on this page.

1.  **Select Panel**: Choose your assigned jury panel from the dropdown menu (e.g., "Industry Experts", "Panel 2").
2.  **Enter Password**: Type the specific password for that panel.
3.  Click **"Login as Jury"** to enter the Jury Dashboard.

- **Customization**: The background for this page is unique to each event and can be set by the Admin (See Section 3.3.4).

---

## 3. The Administrator Role

As an Admin, you have full control over the competition's structure, participants, and appearance. The admin area is split into two main parts: the initial **Event Hub** and the **Event-Specific Dashboard**.

### 3.1. Logging Out

You can log out from any admin page by clicking the **"Logout"** button in the top-right corner of the header.

### 3.2. The Event Hub Page (`/admin/events`)

This is the first page you see after logging in as an Admin. It is your central hub for high-level event management and global settings.



#### 3.2.1. Creating a New Event

- Click the **"Create New Event"** button.
- A dialog will appear. Enter a name for your event (e.g., "Fall Hackathon 2024") and click **"Create Event"**.
- Your new event will appear as a card in the list.

#### 3.2.2. Selecting & Managing an Event

- Each event is displayed as a card.
- To **edit an event's name**, click the pencil icon next to its title, type the new name, and click the checkmark to save.
- To **manage an event**, click the **"Manage"** button on its card. This will take you to the Event-Specific Dashboard (Section 3.3).

#### 3.2.3. Managing Global Backgrounds

On this page, you can set the background images for the two initial pages of the application.

- **Pre-Landing Page Background**: Controls the image on the very first welcome screen.
- **Login Page Background**: Controls the image on the "Select Your Role" screen.

For each, you can either **upload an image** directly or **paste a URL** from an image hosting service. Click **"Save Background"** to apply the changes.

### 3.3. The Event-Specific Dashboard (`/admin`)

After selecting an event to manage, you land on this dashboard. The name of the currently active event is displayed prominently at the top. A navigation menu appears on the left (or in a mobile drawer) with tools to manage this specific event.



#### 3.3.1. Dashboard

- This is the main view, showing a **bar chart of the top 10 teams** based on their current average scores. It provides a quick, visual overview of the leaderboard.

#### 3.3.2. Upload Teams (`/admin/upload`)

This is where you add participants to your event. You have three methods:

1.  **Convert with AI**: Paste unstructured text (like a list of names from an email or a document) or upload a `.txt`/`.csv`/`.xlsx` file. You can edit the prompt to guide the AI on how to correctly parse your data into a `teamName` and `projectName`. The AI will generate a structured JSON output, which you can then copy.
2.  **Paste JSON**: Paste the JSON data (either manually created or from the AI converter) into the text area and click **"Upload Teams"**.
3.  **Upload File**: Upload a `.json` file that follows the required format.

#### 3.3.3. Manage Criteria (`/admin/criteria`)

Here, you define the scoring categories for your event.

- **Activate/Deactivate**: Use the toggle switches to enable or disable specific criteria for the event. Only active criteria will appear on the jury's scoring form.
- **Edit Criteria**: Click the pencil icon to edit a criterion's name, description, or maximum possible score.
- **Reset to Default**: Click this button to wipe the current criteria and load a predefined set of common evaluation criteria.

#### 3.3.4. Customize Backgrounds (`/admin/upload-image`)

This page allows you to set a **unique background image for the Jury Panel Login screen** of the currently selected event. This is perfect for branding each event individually.

#### 3.3.5. App Settings (`/admin/settings`)

- **Customize UI Labels**: Change the default text for "Team Name" and "Project Name" to something else, like "Participant" and "Idea". These labels will be updated across the entire application.

---

## 4. The Jury Role

As a Jury member, your role is to evaluate and score the teams.

### 4.1. Logging In

Follow the steps in Section 2.2 and 2.3 to select your event and log in with your panel's password.

### 4.2. Jury Dashboard (`/jury`)



After logging in, you'll see a list of all teams in the event.

- The list is sorted alphabetically by team name.
- A **"Status"** badge shows whether you have already scored a team ("Scored") or if it's still waiting for your evaluation ("Pending").
- Click **"Score Now"** (or "View Score") to proceed to the evaluation form for that team.

### 4.3. Evaluation Form (`/jury/evaluate/[teamId]`)



This is where you submit your evaluation.

1.  **Review Team Info**: The team and project name are displayed at the top.
2.  **Enter Scores**: For each active criterion, enter a score in the input box. The form will prevent you from entering a score higher than the maximum allowed.
3.  **Add Remarks**: Provide qualitative feedback in the "Remarks" text area. This is highly valuable for the final consolidated feedback.
4.  **View Total Score**: The total score is calculated automatically at the bottom as you enter points.
5.  **Submit**: Click **"Submit Score"**. The form will then lock. If you need to make a change, you can click the **"Edit Score"** button to unlock it, make your adjustments, and re-submit by clicking **"Update Score"**.

Once you are done, you can navigate back to your dashboard to select another team to evaluate.

---

This concludes the user manual. Enjoy using ScoreBench!
