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
        padding: "2rem 1rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        color: "#e2e8f0",
        minHeight: "100vh",
        background: "linear-gradient(180deg, #0a0a1a 0%, #111128 100%)",
      }}
    >
      <h1
        style={{
          marginBottom: "0.5rem",
          fontSize: "1.8rem",
          textAlign: "center",
          color: "#facc15",
          textShadow: "0 0 10px rgba(250, 204, 21, 0.5), 2px 2px 0 #000",
          letterSpacing: "2px",
        }}
      >
        MACHINE SOKOBAN
      </h1>
      <p
        style={{
          marginTop: 0,
          opacity: 0.7,
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          fontSize: "0.85rem",
          marginBottom: "1.5rem",
        }}
      >
        WASD / Arrow keys to move. Machines update every input step.
      </p>
      <div
        style={{
          display: "flex",
          gap: "1rem",
          marginBottom: "1rem",
          fontSize: "0.85rem",
          alignItems: "center",
          flexWrap: "wrap",
          justifyContent: "center",
          background: "rgba(255,255,255,0.05)",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid #1f2937",
        }}
      >
        <span>
          Level:{" "}
          <span style={{ color: "#38bdf8" }}>
            {state.levelIndex + 1}/{LEVELS.length}
          </span>
        </span>
        <span>
          Moves:{" "}
          <span style={{ color: "#38bdf8" }}>{state.moveCount}</span>
        </span>
        <span>
          Status:{" "}
          <span
            style={{
              color: state.status === "won" ? "#4ade80" : "#f59e0b",
            }}
          >
            {state.status === "won" ? "Won" : "Playing"}
          </span>
        </span>
        <button
          type="button"
          onClick={onRestart}
          style={{
            background: "#1f2937",
            color: "#e2e8f0",
            border: "1px solid #374151",
            borderRadius: "4px",
            padding: "0.4rem 0.8rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.65rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#374151";
            e.currentTarget.style.borderColor = "#6b7280";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1f2937";
            e.currentTarget.style.borderColor = "#374151";
          }}
        >
          RESTART
        </button>
        <button
          type="button"
          onClick={onNextLevel}
          disabled={state.status !== "won" || !hasNextLevel}
          style={{
            background:
              state.status === "won" && hasNextLevel
                ? "linear-gradient(180deg, #16a34a, #166534)"
                : "#1f2937",
            color:
              state.status === "won" && hasNextLevel ? "#ffffff" : "#6b7280",
            border:
              state.status === "won" && hasNextLevel
                ? "1px solid #22c55e"
                : "1px solid #374151",
            borderRadius: "4px",
            padding: "0.4rem 0.8rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.65rem",
            cursor:
              state.status === "won" && hasNextLevel ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
            opacity: state.status !== "won" || !hasNextLevel ? 0.5 : 1,
          }}
          onMouseEnter={(e) => {
            if (state.status === "won" && hasNextLevel) {
              e.currentTarget.style.filter = "brightness(1.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.filter = "brightness(1)";
          }}
        >
          {hasNextLevel ? "NEXT LEVEL" : "NO MORE LEVELS"}
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
