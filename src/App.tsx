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
        padding: "2rem 1rem 4rem",
        maxWidth: "900px",
        margin: "0 auto",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        color: "#e2e8f0",
        background:
          "linear-gradient(180deg, rgba(168, 85, 240, 0.12) 0%, rgba(10, 10, 26, 0) 40%)," +
          "linear-gradient(180deg, #0a0a1a 0%, #111128 100%)",
      }}
    >
      <h1
        style={{
          marginBottom: "0.5rem",
          fontSize: "1.8rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #f0f 0%, #a855f7 50%, #06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 8px rgba(168, 85, 240, 0.6))",
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
          background: "rgba(168, 85, 240, 0.08)",
          padding: "0.75rem 1rem",
          borderRadius: "8px",
          border: "1px solid rgba(168, 85, 240, 0.3)",
          boxShadow: "0 0 15px rgba(168, 85, 240, 0.1), inset 0 0 15px rgba(168, 85, 240, 0.05)",
        }}
      >
        <span>
          Level:{" "}
          <span style={{ color: "#06b6d4", textShadow: "0 0 6px rgba(6, 182, 212, 0.5)" }}>
            {state.levelIndex + 1}/{LEVELS.length}
          </span>
        </span>
        <span>
          Moves:{" "}
          <span style={{ color: "#06b6d4", textShadow: "0 0 6px rgba(6, 182, 212, 0.5)" }}>
            {state.moveCount}
          </span>
        </span>
        <span>
          Status:{" "}
          <span
            style={{
              color: state.status === "won" ? "#4ade80" : "#f59e0b",
              textShadow:
                state.status === "won"
                  ? "0 0 6px rgba(74, 222, 128, 0.5)"
                  : "0 0 6px rgba(245, 158, 11, 0.5)",
            }}
          >
            {state.status === "won" ? "Won" : "Playing"}
          </span>
        </span>
        <button
          type="button"
          onClick={onRestart}
          style={{
            background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#c084fc",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.4rem 0.8rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.65rem",
            cursor: "pointer",
            transition: "all 0.15s ease",
            boxShadow: "0 0 8px rgba(124, 58, 237, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "linear-gradient(180deg, #374151 0%, #1f2937 100%)";
            e.currentTarget.style.borderColor = "#a78bfa";
            e.currentTarget.style.boxShadow = "0 0 12px rgba(167, 139, 250, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "linear-gradient(180deg, #1f2937 0%, #111827 100%)";
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.boxShadow = "0 0 8px rgba(124, 58, 237, 0.3)";
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
                ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color:
              state.status === "won" && hasNextLevel ? "#ffffff" : "#6b7280",
            border:
              state.status === "won" && hasNextLevel
                ? "1px solid #a855f7"
                : "1px solid #374151",
            borderRadius: "4px",
            padding: "0.4rem 0.8rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.65rem",
            cursor:
              state.status === "won" && hasNextLevel ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
            opacity: state.status !== "won" || !hasNextLevel ? 0.5 : 1,
            boxShadow:
              state.status === "won" && hasNextLevel
                ? "0 0 12px rgba(168, 85, 240, 0.5)"
                : "none",
          }}
          onMouseEnter={(e) => {
            if (state.status === "won" && hasNextLevel) {
              e.currentTarget.style.boxShadow = "0 0 16px rgba(168, 85, 240, 0.7)";
              e.currentTarget.style.filter = "brightness(1.1)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow =
              "0 0 12px rgba(168, 85, 240, 0.5)";
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
