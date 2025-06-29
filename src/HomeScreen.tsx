import React from "react";

interface HomeScreenProps {
  onCreateRoom: () => void;
  onJoinRoom: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background: "#3a3a3a",
      }}
    >
      <h1 style={{ marginBottom: 40, marginRight: 20, textAlign: "center" }}>
        Pictionary Game
      </h1>
      <button
        style={{
          padding: "18px 36px",
          fontSize: "1.2rem",
          marginBottom: 24,
          borderRadius: 8,
          border: "none",
          background: "#1976d2",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
        onClick={onCreateRoom}
      >
        Create Room
      </button>
      <button
        style={{
          padding: "18px 36px",
          fontSize: "1.2rem",
          borderRadius: 8,
          border: "none",
          background: "#43a047",
          color: "#fff",
          fontWeight: "bold",
          cursor: "pointer",
        }}
        onClick={onJoinRoom}
      >
        Join Room
      </button>
    </div>
  );
};

export default HomeScreen;
