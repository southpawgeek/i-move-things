import type { Direction } from "../logic/types";

export type GameAction = { type: "MOVE_PLAYER"; direction: Direction };

export function movePlayer(direction: Direction): GameAction {
  return { type: "MOVE_PLAYER", direction };
}
