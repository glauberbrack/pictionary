import React, { useState, useEffect } from "react";
import LobbyScreen from "./LobbyScreen";
import GameScreen from "./GameScreen";
import { socket } from "./socket";

interface CreateRoomScreenProps {
  onBack: () => void;
  setPlayerName: (name: string) => void;
  playerName: string;
}

const CreateRoomScreen: React.FC<CreateRoomScreenProps> = ({
  onBack,
  setPlayerName,
  playerName,
}) => {
  const [step, setStep] = useState<"name" | "lobby" | "loading" | "game">(
    "name"
  );
  const [roomCode, setRoomCode] = useState("");
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [creatorId, setCreatorId] = useState("");
  const [drawerId, setDrawerId] = useState("");
  const [word, setWord] = useState<string | undefined>(undefined);

  useEffect(() => {
    function onRoomCreated(data: {
      roomCode: string;
      players: { id: string; name: string }[];
      creatorId: string;
    }) {
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setCreatorId(data.creatorId);
      setStep("lobby");
    }
    function onRoomUpdated(data: {
      roomCode: string;
      players: { id: string; name: string }[];
      creatorId: string;
    }) {
      setRoomCode(data.roomCode);
      setPlayers(data.players);
      setCreatorId(data.creatorId);
      setStep("lobby");
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
    socket.on("room_created", onRoomCreated);
    socket.on("room_updated", onRoomUpdated);
    socket.on("game_started", onGameStarted);
    socket.on("your_word", onYourWord);
    return () => {
      socket.off("room_created", onRoomCreated);
      socket.off("room_updated", onRoomUpdated);
      socket.off("game_started", onGameStarted);
      socket.off("your_word", onYourWord);
    };
  }, []);

  if (step === "lobby") {
    return (
      <LobbyScreen
        roomCode={roomCode}
        players={players.map((p) => p.name)}
        isCreator={creatorId === socket.id}
        onStart={() => socket.emit("start_game", { roomCode })}
        onBack={onBack}
        canStart={players.length >= 2}
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
        <h2>Creating room...</h2>
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
      <h2>Create Room</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (playerName.trim()) {
            setStep("loading");
            socket.emit("create_room", { playerName });
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
            marginBottom: 24,
            width: 220,
          }}
          required
        />
        <button
          type="submit"
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
        >
          Create Room
        </button>
        <button type="button" onClick={onBack}>
          Back
        </button>
      </form>
    </div>
  );
};

export default CreateRoomScreen;
