# Utpadakata - Productivity Workspace

Utpadakata is a modern, collaborative productivity application featuring an infinite canvas, tasks, groups, expense tracking, and AI assistance.

## 🚀 Installation & Setup

To run this application on your local machine, follow these steps.

### Prerequisites
*   [Node.js](https://nodejs.org/) installed.
*   A MongoDB Database (e.g., [MongoDB Atlas](https://www.mongodb.com/atlas/database) free tier).

### 1. Backend Setup (Server)
This handles the database connection and saving user data.

1.  Open the project root folder in your terminal.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Open `server.js` and paste your **MongoDB Connection String** into the `MONGO_URI` variable.
4.  Start the server:
    ```bash
    npm start
    ```
    You should see: `✅ MongoDB Connected Successfully`.

### 2. Frontend Setup (User Interface)
The frontend is built with React and TypeScript. We recommend using **Vite** to run it.

1.  In a separate terminal window (keep the server running), create a React+TS app:
    ```bash
    npm create vite@latest client -- --template react-ts
    ```
2.  **Move Files**: Copy all the source files (`App.tsx`, `index.tsx`, `types.ts`, `constants.ts`, `components/`, `services/`) into the `client/src/` folder.
    *   *Note: Rename `index.tsx` to `main.tsx` if Vite uses that naming convention.*
    *   *Copy `index.html` to `client/index.html`.*
3.  **Install Frontend Libraries**:
    ```bash
    cd client
    npm install lucide-react recharts @google/genai tailwindcss postcss autoprefixer
    ```
4.  **Initialize Tailwind**:
    ```bash
    npx tailwindcss init -p
    ```
    (Update `tailwind.config.js` to scan your src files).
5.  **Run the App**:
    ```bash
    npm run dev
    ```
6.  Open the localhost link provided (usually `http://localhost:5173`).

### 📲 Installing as an App (PWA)

Once the app is running in your browser:

*   **Desktop**: Click the "Install" icon in the browser address bar.
*   **Mobile**: Tap "Share" -> "Add to Home Screen".

## 🛠 Features

*   **Infinite Canvas**: Drag to pan, Ctrl+Scroll to zoom.
*   **Tasks & Groups**: Create tasks, set priorities/deadlines, and organize them into groups.
*   **Expenses**: Track spending with widgets and visualize data on the Dashboard.
*   **AI Assist**: Click "AI Assist" to analyze your board or generate tasks from notes.
*   **Collaboration**: Share your workspace link (requires backend running).
