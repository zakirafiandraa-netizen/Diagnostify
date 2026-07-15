# Diagnostify
# diagnostify.vercel.app

Diagnostify is a medical-themed social deduction game inspired by *Undercover*, designed to test your medical knowledge and deduction skills. Players are assigned secret roles and must use medical clues to uncover the imposters among them.

The game features both a **Local Pass-and-Play (Offline) Mode** and a real-time **Online Multiplayer Mode**.

## How to Play

### Roles
*   **Civilian (Majority):** You receive the main medical diagnosis (e.g., "Asthma"). Your goal is to describe it without being too obvious, figure out who doesn't know the word, and vote them out.
*   **Undercover:** You receive a closely related differential diagnosis (e.g., "COPD"). You must blend in, pretend you have the Civilian word, and avoid elimination.
*   **Mr. White:** You receive *no word at all*. You must listen carefully to others, bluff your way through, and try to guess the Civilian word.

### Game Phases
1.  **Role Reveal:** Players secretly view their assigned role and word.
2.  **Discussion:** Each player takes turns giving a single-word or short phrase clue describing their diagnosis.
3.  **Voting:** Players vote on who they think the Undercover/Mr. White is. The player with the most votes is eliminated.
4.  **Quiz (Bonus Round):** Players answer a multiple-choice medical question related to the category. The fastest correct answer earns a special privilege (Bonus Points, Immunity, or forcing a Clue Request).
5.  **Final Ranking:** The game ends when only 3 players remain. Points are tallied based on survival and quiz performance.

## Getting Started

The project is split into a React frontend and a Node.js backend. You will need to run both to fully utilize the online features.

### Prerequisites
*   [Node.js](https://nodejs.org/) (v16 or higher recommended)
*   npm (comes with Node.js)

### Running the Application

You will need two terminal windows/tabs to run the frontend and backend simultaneously.

#### 1. Start the Backend (Socket.io Server)
Open your first terminal and run:
```bash
cd backend
npm install
npm run dev
```
The backend server will start (typically on port 3001).

#### 2. Start the Frontend (React App)
Open your second terminal and run:
```bash
cd frontend
npm install
npm run dev
```
The frontend will start (typically on port 5173). Open the provided local URL (e.g., `http://localhost:5173`) in your browser to play!

## Technologies Used
*   **Frontend:** React, TypeScript, Tailwind CSS, Framer Motion (for animations), Lucide React (for icons)
*   **Backend:** Node.js, Express, Socket.io (for real-time multiplayer)

## Features
*   **Offline Mode:** Play with friends on a single device using the pass-and-play system. Includes full role assignment, voting validation, and interactive quizzes.
*   **Online Mode:** Create rooms, join with a code, and play in real-time across multiple devices.
*   **Medical Database:** A built-in JSON database of medical diagnoses and related differential diagnoses to keep the game challenging and educational.
*   **Privilege System:** Reward fast thinking in the quiz rounds with game-changing privileges like Immunity or Clue Requests.
