import React, { useState, useRef, useEffect } from "react";
import HomeScreen from "./HomeScreen";
import { socket } from "./socket";
import DrawingBoard, { type DrawingAction } from "./DrawingBoard";

// LobbyScreen component
const LobbyScreen: React.FC<{
  roomCode: string;
  players: string[];
  isCreator: boolean;
  onStart: () => void;
  onBack: () => void;
  canStart: boolean;
}> = ({ roomCode, players, isCreator, onStart, onBack, canStart }) => (
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

const GameScreen: React.FC<{
  isDrawer: boolean;
  word?: string;
  players: string[];
  roomCode?: string;
  playerName: string;
}> = ({ isDrawer, word, players, roomCode, playerName }) => {
  // Drawing state for guessers
  const [drawingData, setDrawingData] = useState<DrawingAction[]>([]);
  // Chat state
  const [messages, setMessages] = useState<
    { playerName: string; message: string }[]
  >([]);
  const [guess, setGuess] = useState("");
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const [scores, setScores] = useState<{ [id: string]: number }>({});
  const [showCorrect, setShowCorrect] = useState<{
    playerName: string;
    word: string;
  } | null>(null);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (!isDrawer) {
      const handler = (data: DrawingAction) => {
        setDrawingData((prev) => [...prev, data]);
      };
      socket.on("drawing_data", handler);
      return () => {
        socket.off("drawing_data", handler);
      };
    }
  }, [isDrawer]);

  useEffect(() => {
    const chatHandler = (data: { playerName: string; message: string }) => {
      console.log("Received chat_message:", data);
      setMessages((prev) => [...prev, data]);
    };
    const chatHistoryHandler = (
      history: { playerName: string; message: string }[]
    ) => {
      console.log("Received chat_history:", history);
      setMessages(history);
    };
    socket.on("chat_message", chatHandler);
    socket.on("chat_history", chatHistoryHandler);
    return () => {
      socket.off("chat_message", chatHandler);
      socket.off("chat_history", chatHistoryHandler);
      setMessages([]);
    };
  }, []);

  // Listen for correct guess and new round
  useEffect(() => {
    const correctHandler = (data: {
      playerName: string;
      word: string;
      scores: { [id: string]: number };
    }) => {
      setShowCorrect({ playerName: data.playerName, word: data.word });
      setScores(data.scores);
    };
    const gameStartedHandler = (data: {
      drawerId: string;
      players: { id: string; name: string }[];
      scores: { [id: string]: number };
    }) => {
      setDrawingData([]); // Clear drawing
      setMessages([]); // Clear chat
      setScores(data.scores || {});
      setShowCorrect(null); // Hide correct guess notification
      setResetKey((k) => k + 1); // Force DrawingBoard to re-mount
    };
    socket.on("correct_guess", correctHandler);
    socket.on("game_started", gameStartedHandler);
    return () => {
      socket.off("correct_guess", correctHandler);
      socket.off("game_started", gameStartedHandler);
    };
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  {
    console.log("Mensagens", messages);
  }
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !roomCode) return;
    console.log("Sending guess:", { roomCode, playerName, message: guess });
    socket.emit("guess", { roomCode, playerName, message: guess });
    setGuess("");
  };

  // Show scores for all players
  const renderScores = () => (
    <div style={{ marginBottom: 16 }}>
      <strong>Scores:</strong>
      <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: 16 }}>
        {players.map((p, i) => (
          <li key={i} style={{ fontWeight: "bold", color: "#1976d2" }}>
            {p}: {scores[Object.keys(scores)[i]] ?? 0}
          </li>
        ))}
      </ul>
    </div>
  );

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
      <h2>Game Started!</h2>
      {renderScores()}
      {showCorrect && (
        <div
          style={{
            background: "#43a047",
            color: "#fff",
            padding: "12px 24px",
            borderRadius: 8,
            fontWeight: "bold",
            marginBottom: 16,
            fontSize: 20,
          }}
        >
          🎉 {showCorrect.playerName} guessed the word "{showCorrect.word}"!
        </div>
      )}
      <div style={{ marginBottom: 12 }}>
        <strong>Players:</strong>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {players.map((p, i) => (
            <li key={`player-${i}`}>{p}</li>
          ))}
        </ul>
      </div>
      {isDrawer ? (
        <>
          <div
            style={{
              color: "#1976d2",
              fontWeight: "bold",
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            Your turn to draw:{" "}
            <span style={{ textDecoration: "underline" }}>{word}</span>
          </div>
          <DrawingBoard
            key={resetKey}
            canDraw={true}
            onDraw={(data: DrawingAction) => {
              if (roomCode) socket.emit("drawing_data", { roomCode, data });
            }}
          />
        </>
      ) : (
        <>
          <div
            style={{
              color: "#43a047",
              fontWeight: "bold",
              fontSize: 24,
              marginBottom: 12,
            }}
          >
            You are guessing!
          </div>
          <DrawingBoard
            key={resetKey}
            canDraw={false}
            drawingData={drawingData}
          />
          <form
            onSubmit={handleGuessSubmit}
            style={{
              display: "flex",
              marginTop: 16,
              width: "100%",
              maxWidth: 600,
            }}
          >
            <input
              type="text"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Type your guess..."
              style={{
                flex: 1,
                padding: 12,
                fontSize: "1.1rem",
                borderRadius: 8,
                border: "1px solid #ccc",
                marginRight: 8,
              }}
              disabled={isDrawer}
              autoFocus
            />
            <button
              type="submit"
              style={{
                padding: "12px 24px",
                fontSize: "1rem",
                borderRadius: 8,
                background: "#1976d2",
                color: "#fff",
                border: "none",
                fontWeight: "bold",
              }}
              disabled={isDrawer || !guess.trim()}
            >
              Guess
            </button>
          </form>
        </>
      )}
      {/* Chat messages (show for both roles) */}
      <div
        ref={chatBoxRef}
        style={{
          width: "100%",
          maxWidth: 600,
          marginTop: 24,
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          padding: 12,
          minHeight: 80,
          maxHeight: 200,
          overflowY: "auto",
        }}
      >
        {messages.map((msg, i) => (
          <div key={`msg-${i}`} style={{ marginBottom: 4, color: "#000" }}>
            <strong>{msg.playerName}:</strong> {msg.message}
          </div>
        ))}
      </div>
      {/* Drawer can see chat, but cannot send guesses */}
      {isDrawer && (
        <form
          onSubmit={(e) => e.preventDefault()}
          style={{
            display: "flex",
            marginTop: 16,
            width: "100%",
            maxWidth: 600,
          }}
        >
          <input
            type="text"
            value={""}
            placeholder="Guessing disabled for drawer"
            style={{
              flex: 1,
              padding: 12,
              fontSize: "1.1rem",
              borderRadius: 8,
              border: "1px solid #ccc",
              marginRight: 8,
              background: "#eee",
            }}
            disabled
          />
          <button
            type="button"
            style={{
              padding: "12px 24px",
              fontSize: "1rem",
              borderRadius: 8,
              background: "#aaa",
              color: "#fff",
              border: "none",
              fontWeight: "bold",
            }}
            disabled
          >
            Guess
          </button>
        </form>
      )}
    </div>
  );
};

// CreateRoomScreen
const CreateRoomScreen: React.FC<{
  onBack: () => void;
  setPlayerName: (name: string) => void;
  playerName: string;
}> = ({ onBack, setPlayerName, playerName }) => {
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

const JoinRoomScreen: React.FC<{
  onBack: () => void;
  setPlayerName: (name: string) => void;
  playerName: string;
}> = ({ onBack, setPlayerName, playerName }) => {
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

function App() {
  const [screen, setScreen] = useState<"home" | "create" | "join">("home");
  const [playerName, setPlayerName] = useState("");

  if (screen === "create")
    return (
      <CreateRoomScreen
        onBack={() => setScreen("home")}
        setPlayerName={setPlayerName}
        playerName={playerName}
      />
    );
  if (screen === "join")
    return (
      <JoinRoomScreen
        onBack={() => setScreen("home")}
        setPlayerName={setPlayerName}
        playerName={playerName}
      />
    );

  return (
    <HomeScreen
      onCreateRoom={() => setScreen("create")}
      onJoinRoom={() => setScreen("join")}
    />
  );
}

export default App;
