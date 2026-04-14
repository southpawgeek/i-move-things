import type { GameAction } from "./actions";
import type { GameState } from "../logic/types";
import { checkWinCondition } from "../logic/checkWinCondition";
import { movePlayer } from "../logic/movePlayer";

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type !== "MOVE_PLAYER") return state;

  const movedState = movePlayer(state, action.direction);
  if (movedState === state) return state;

  return {
    ...movedState,
    status: checkWinCondition(movedState) ? "won" : "playing",
  };
}
