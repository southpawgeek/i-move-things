import type { Direction, LevelDefinition } from "../logic/types";

export type GameAction =
  | { type: "MOVE_PLAYER"; direction: Direction }
  | { type: "RESTART_LEVEL" }
  | { type: "LOAD_LEVEL"; levelIndex: number; level: LevelDefinition };

export function movePlayer(direction: Direction): GameAction {
  return { type: "MOVE_PLAYER", direction };
}

export function restartLevel(): GameAction {
  return { type: "RESTART_LEVEL" };
}

export function loadLevel(levelIndex: number, level: LevelDefinition): GameAction {
  return { type: "LOAD_LEVEL", levelIndex, level };
}
