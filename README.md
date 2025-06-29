# Pictionary Game

A real-time, mobile-friendly Pictionary game where web and mobile users can play together!

## Getting Started

### 1. Clone the Repository
```sh
git clone <your-repo-url>
cd pictionary-game
```

### 2. Start the Backend (Socket.IO Server)

```
cd server
npm install
npm start
```

- The server will start on `http://localhost:4000` by default.

### 3. Start the Frontend (Vite + React)

Open a new terminal in the project root:

```
cd .. # if you are still in the server folder
npm install
npm run dev
```

- The Vite app will start on `http://localhost:5173` (or similar).

### 4. Open the App
- Visit `http://localhost:5173` in your browser (mobile or desktop).
- You can open multiple tabs or devices to test real-time features.

---

## Project Structure

- `/server` - Node.js + Socket.IO backend
- `/src` - React frontend (Vite)

---

## Notes
- Make sure the backend server is running before starting the frontend.
- Both server and client must run locally for full functionality.
- For production, deploy the server and client to your preferred platforms.

