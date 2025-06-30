import React from "react";

interface LobbyScreenProps {
  roomCode: string;
  players: string[];
  isCreator: boolean;
  onStart: () => void;
  onBack: () => void;
  canStart: boolean;
}

const LobbyScreen: React.FC<LobbyScreenProps> = ({
  roomCode,
  players,
  isCreator,
  onStart,
  onBack,
  canStart,
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      width: "100vw",
      height: "100vh",
    }}
  >
    <h2>Lobby</h2>
    <div style={{ marginBottom: 16 }}>
      <strong>Room Code:</strong>{" "}
      <span style={{ fontSize: 24, letterSpacing: 2 }}>{roomCode}</span>
      <button
        style={{ marginLeft: 12 }}
        onClick={() => navigator.clipboard.writeText(roomCode)}
      >
        Copy
      </button>
    </div>
    <div style={{ marginBottom: 16 }}>
      <strong>Players:</strong>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {players.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
    </div>
    {isCreator && (
      <button
        style={{
          padding: "12px 28px",
          fontSize: "1rem",
          borderRadius: 8,
          background: "#1976d2",
          color: "#fff",
          border: "none",
          fontWeight: "bold",
          marginBottom: 16,
        }}
        onClick={onStart}
        disabled={!canStart}
      >
        Start Game
      </button>
    )}
    <button onClick={onBack}>Back</button>
  </div>
);

export default LobbyScreen;
