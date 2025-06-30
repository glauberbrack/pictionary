import React, { useState, useEffect } from "react";
import LobbyScreen from "./LobbyScreen";
import GameScreen from "./GameScreen";
import { socket } from "./socket";

interface JoinRoomScreenProps {
  onBack: () => void;
  setPlayerName: (name: string) => void;
  playerName: string;
}

const JoinRoomScreen: React.FC<JoinRoomScreenProps> = ({
  onBack,
  setPlayerName,
  playerName,
}) => {
  const [step, setStep] = useState<"form" | "lobby" | "loading" | "game">(
    "form"
  );
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [creatorId, setCreatorId] = useState("");
  const [error, setError] = useState("");
  const [drawerId, setDrawerId] = useState("");
  const [word, setWord] = useState<string | undefined>(undefined);

  useEffect(() => {
    function onRoomUpdated(data: {
      roomCode: string;
      players: { id: string; name: string }[];
      creatorId: string;
    }) {
      setPlayers(data.players);
      setCreatorId(data.creatorId);
      setStep("lobby");
      setError("");
    }
    function onJoinError(data: { message: string }) {
      setError(data.message);
      setStep("form");
    }
    function onGameStarted(data: {
      drawerId: string;
      players: { id: string; name: string }[];
    }) {
      setDrawerId(data.drawerId);
      setPlayers(data.players);
      setStep("game");
    }
    function onYourWord(data: { word: string }) {
      setWord(data.word);
    }
    socket.on("room_updated", onRoomUpdated);
    socket.on("join_error", onJoinError);
    socket.on("game_started", onGameStarted);
    socket.on("your_word", onYourWord);
    return () => {
      socket.off("room_updated", onRoomUpdated);
      socket.off("join_error", onJoinError);
      socket.off("game_started", onGameStarted);
      socket.off("your_word", onYourWord);
    };
  }, []);

  if (step === "lobby") {
    return (
      <LobbyScreen
        roomCode={roomCode.toUpperCase()}
        players={players.map((p) => p.name)}
        isCreator={creatorId === socket.id}
        onStart={() => {}}
        onBack={onBack}
        canStart={false}
      />
    );
  }

  if (step === "game") {
    return (
      <GameScreen
        isDrawer={drawerId === socket.id}
        word={word}
        players={players.map((p) => p.name)}
        roomCode={roomCode}
        playerName={playerName}
      />
    );
  }

  if (step === "loading") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <h2>Joining room...</h2>
      </div>
    );
  }

  return (
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
      <h2>Join Room</h2>
      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (playerName.trim() && roomCode.trim()) {
            setStep("loading");
            socket.emit("join_room", {
              roomCode: roomCode.toUpperCase(),
              playerName,
            });
          }
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <input
          type="text"
          placeholder="Your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          style={{
            fontSize: "1.1rem",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 16,
            width: 220,
          }}
          required
        />
        <input
          type="text"
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          style={{
            fontSize: "1.1rem",
            padding: "12px",
            borderRadius: 8,
            border: "1px solid #ccc",
            marginBottom: 24,
            width: 220,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
          required
        />
        <button
          type="submit"
          style={{
            padding: "12px 28px",
            fontSize: "1rem",
            borderRadius: 8,
            background: "#43a047",
            color: "#fff",
            border: "none",
            fontWeight: "bold",
            marginBottom: 16,
          }}
        >
          Join Room
        </button>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </form>
    </div>
  );
};

export default JoinRoomScreen;
