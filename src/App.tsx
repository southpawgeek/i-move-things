import { GameProvider } from "./store/GameContext";
import { createInitialState } from "./logic/levels";

export default function App() {
  return (
    <GameProvider initialState={createInitialState()}>
      <div style={{ padding: "1rem", fontFamily: "system-ui, sans-serif" }}>
        <h1>Machine Sokoban</h1>
        <p>Phase 1: logic + state. Rendering comes later.</p>
      </div>
    </GameProvider>
  );
}
