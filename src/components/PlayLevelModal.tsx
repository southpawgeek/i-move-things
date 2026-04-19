import { useReducer, useRef, useState, useEffect, type ReactElement } from "react";
import { GameCanvas } from "./GameCanvas";
import { GameProvider } from "../store/GameContext";
import { gameReducer } from "../store/gameReducer";
import { loadLevel, restartLevel } from "../store/actions";
import type { LevelDefinition } from "../logic/types";

interface PlayLevelModalProps {
  level: LevelDefinition;
  levelIndex: number;
  onClose: () => void;
}

function PlayLevelScreen({
  level,
  levelIndex,
  onClose,
}: PlayLevelModalProps): ReactElement {
  const [state, dispatch] = useReducer(gameReducer, {
    ...loadLevel(levelIndex, level),
  } as any);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.75rem",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          fontSize: "0.75rem",
          color: "#a78bfa",
        }}
      >
        <span>
          Level {levelIndex + 1} — WASD/Arrows to move
        </span>
        <button
          type="button"
          onClick={() => dispatch(restartLevel())}
          style={{
            background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#c084fc",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.3rem 0.6rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.6rem",
            cursor: "pointer",
          }}
        >
          RESTART
        </button>
        <button
          type="button"
          onClick={onClose}
          style={{
            background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#e2e8f0",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.3rem 0.6rem",
            fontFamily: "'Press Start 2P', 'Courier New', monospace",
            fontSize: "0.6rem",
            cursor: "pointer",
          }}
        >
          CLOSE
        </button>
      </div>
      <GameProvider
        initialState={{
          ...loadLevel(levelIndex, level),
          status: "playing",
          moveCount: 0,
          frozenPuddles: [],
          nextEntityId: 0,
        } as any}
      >
        <GameCanvas />
      </GameProvider>
    </div>
  );
}

export function PlayLevelModal({
  level,
  levelIndex,
  onClose,
}: PlayLevelModalProps): ReactElement {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        style={{
          background:
            "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)",
          color: "#fff",
          border: "1px solid #a855f7",
          borderRadius: "4px",
          padding: "0.5rem 1rem",
          fontFamily: "'Press Start 2P', 'Courier New', monospace",
          fontSize: "0.75rem",
          cursor: "pointer",
          boxShadow: "0 0 12px rgba(168, 85, 240, 0.5)",
        }}
      >
        TEST LEVEL
      </button>
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(180deg, #0a0a1a 0%, #111128 100%)",
              border: "1px solid #7c3aed",
              borderRadius: "12px",
              padding: "1.5rem",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 0 30px rgba(168, 85, 240, 0.3)",
            }}
          >
            <PlayLevelScreen
              level={level}
              levelIndex={levelIndex}
              onClose={() => setIsOpen(false)}
            />
          </div>
        </div>
      )}
    </>
  );
}
