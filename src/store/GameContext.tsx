import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactElement,
  type ReactNode,
} from "react";
import type { GameState } from "../logic/types";
import type { GameAction } from "./actions";
import { gameReducer } from "./gameReducer";

export interface GameContextValue {
  state: GameState;
  dispatch: Dispatch<GameAction>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({
  initialState,
  children,
}: {
  initialState: GameState;
  children: ReactNode;
}): ReactElement {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error("useGame must be used within GameProvider");
  }
  return ctx;
}
