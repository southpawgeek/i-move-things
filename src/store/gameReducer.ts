import type { GameAction } from "./actions";
import type { GameState } from "../logic/types";
import { gameStep } from "../logic/gameStep";
import { createInitialState } from "../logic/levels";

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "MOVE_PLAYER":
      return gameStep(state, action);
    case "RESTART_LEVEL":
      return createInitialState(state.level, state.levelIndex);
    case "LOAD_LEVEL":
      return createInitialState(action.level, action.levelIndex);
    default:
      return state;
  }
}
