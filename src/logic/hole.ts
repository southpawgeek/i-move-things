import { tileAt } from "./grid";
import type { GameState, Position } from "./types";

/**
 * If a box/debris is pushed into a hole, the hole becomes floor and the entity is consumed.
 */
export function resolveHoleFill(
  state: GameState,
  entityId: string,
  destination: Position,
): GameState | null {
  if (tileAt(state, destination) !== "hole") {
    return null;
  }

  const nextTiles = state.tiles.map((row) => [...row]);
  nextTiles[destination.y][destination.x] = "floor";

  return {
    ...state,
    tiles: nextTiles,
    entities: state.entities.filter((entity) => entity.id !== entityId),
  };
}
