import type { GameAction } from "./actions";
import type { GameState } from "../logic/types";
import { gameStep } from "../logic/gameStep";

export function gameReducer(state: GameState, action: GameAction): GameState {
  return gameStep(state, action);
}
