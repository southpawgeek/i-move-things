import type { GameAction } from "./actions";
import type { Direction, GameState, Position, TileType } from "../logic/types";

const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function inBounds(state: GameState, pos: Position): boolean {
  return (
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < state.level.width &&
    pos.y < state.level.height
  );
}

function tileAt(state: GameState, pos: Position): TileType | undefined {
  if (!inBounds(state, pos)) return undefined;
  const row = state.level.tiles[pos.y];
  return row?.[pos.x];
}

function isWalkableTile(tile: TileType | undefined): boolean {
  return tile !== undefined && tile !== "wall";
}

/**
 * Phase 1: wall collision only. Pushing and machines come in later phases.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  if (action.type !== "MOVE_PLAYER") return state;

  const next: Position = {
    x: state.playerPosition.x + DELTA[action.direction].x,
    y: state.playerPosition.y + DELTA[action.direction].y,
  };

  const targetTile = tileAt(state, next);
  if (!isWalkableTile(targetTile)) {
    return state;
  }

  return {
    ...state,
    playerPosition: next,
    moveCount: state.moveCount + 1,
  };
}
