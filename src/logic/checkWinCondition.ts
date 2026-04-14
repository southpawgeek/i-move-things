import type { GameState } from "./types";

export function checkWinCondition(state: GameState): boolean {
  const tile = state.tiles[state.playerPosition.y]?.[state.playerPosition.x];
  return tile === "goal";
}
