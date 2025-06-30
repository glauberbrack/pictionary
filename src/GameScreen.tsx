import React, { useState, useRef, useEffect } from "react";
import DrawingBoard, { type DrawingAction } from "./DrawingBoard";
import { socket } from "./socket";

interface GameScreenProps {
  isDrawer: boolean;
  word?: string;
  players: string[];
  roomCode?: string;
  playerName: string;
}

const GameScreen: React.FC<GameScreenProps> = ({
  isDrawer,
  word,
  players,
  roomCode,
  playerName,
}) => {
  const [drawingData, setDrawingData] = useState<DrawingAction[]>([]);
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
      setMessages((prev) => [...prev, data]);
    };
    const chatHistoryHandler = (
      history: { playerName: string; message: string }[]
    ) => {
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
      setDrawingData([]);
      setMessages([]);
      setScores(data.scores || {});
      setShowCorrect(null);
      setResetKey((k) => k + 1);
    };
    socket.on("correct_guess", correctHandler);
    socket.on("game_started", gameStartedHandler);
    return () => {
      socket.off("correct_guess", correctHandler);
      socket.off("game_started", gameStartedHandler);
    };
  }, []);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guess.trim() || !roomCode) return;
    socket.emit("guess", { roomCode, playerName, message: guess });
    setGuess("");
  };

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
          389 {showCorrect.playerName} guessed the word "{showCorrect.word}"!
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

export default GameScreen;
