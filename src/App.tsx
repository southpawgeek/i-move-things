import { GameProvider } from "./store/GameContext";
import { createInitialState } from "./logic/levels";
import { useGame } from "./store/GameContext";
import { GameCanvas } from "./components/GameCanvas";

function GameScreen() {
  const { state } = useGame();

  return (
    <div
      style={{
        padding: "1rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        color: "#e2e8f0",
      }}
    >
      <h1 style={{ marginBottom: "0.5rem" }}>Machine Sokoban</h1>
      <p style={{ marginTop: 0, opacity: 0.85 }}>
        WASD / Arrow keys to move. Machines update every input step.
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "0.75rem",
          fontSize: "0.95rem",
        }}
      >
        <span>Moves: {state.moveCount}</span>
        <span>Status: {state.status === "won" ? "Won" : "Playing"}</span>
      </div>
      <GameCanvas />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider initialState={createInitialState()}>
      <GameScreen />
    </GameProvider>
  );
}
