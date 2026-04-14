import { GameProvider } from "./store/GameContext";
import { createInitialState } from "./logic/levels";
import { useGame } from "./store/GameContext";
import { GameCanvas } from "./components/GameCanvas";
import { LEVELS } from "./logic/levelCatalog";
import { loadLevel, restartLevel } from "./store/actions";

function GameScreen() {
  const { state, dispatch } = useGame();
  const hasNextLevel = state.levelIndex < LEVELS.length - 1;

  const onRestart = () => {
    dispatch(restartLevel());
  };

  const onNextLevel = () => {
    if (!hasNextLevel) return;
    const nextIndex = state.levelIndex + 1;
    dispatch(loadLevel(nextIndex, LEVELS[nextIndex]));
  };

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
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        <span>
          Level: {state.levelIndex + 1}/{LEVELS.length}
        </span>
        <span>Moves: {state.moveCount}</span>
        <span>Status: {state.status === "won" ? "Won" : "Playing"}</span>
        <button type="button" onClick={onRestart}>
          Restart
        </button>
        <button
          type="button"
          onClick={onNextLevel}
          disabled={state.status !== "won" || !hasNextLevel}
        >
          {hasNextLevel ? "Next Level" : "No More Levels"}
        </button>
      </div>
      <GameCanvas />
    </div>
  );
}

export default function App() {
  return (
    <GameProvider initialState={createInitialState(LEVELS[0], 0)}>
      <GameScreen />
    </GameProvider>
  );
}
