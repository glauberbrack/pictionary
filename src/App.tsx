import React, { useState } from "react";
import HomeScreen from "./HomeScreen";
import CreateRoomScreen from "./CreateRoomScreen";
import JoinRoomScreen from "./JoinRoomScreen";

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
