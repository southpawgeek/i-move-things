import type { Direction, Entity, GameState, Position } from "./types";
import { DELTA, addPosition, isWalkableTile, tileAt } from "./grid";

const PUSHABLE_KINDS: ReadonlySet<Entity["kind"]> = new Set(["box", "debris"]);
export const PUSHABLE_KINDS_LIST: ReadonlySet<Entity["kind"]> = PUSHABLE_KINDS;

function findSolidEntityAt(state: GameState, pos: Position): Entity | undefined {
  return state.entities.find(
    (entity) =>
      entity.position.x === pos.x &&
      entity.position.y === pos.y &&
      PUSHABLE_KINDS.has(entity.kind),
  );
}

export function movePlayer(state: GameState, direction: Direction): GameState {
  const step = DELTA[direction];
  const target = addPosition(state.playerPosition, step);
  const targetTile = tileAt(state, target);

  if (!isWalkableTile(targetTile)) {
    return state;
  }

  const targetEntity = findSolidEntityAt(state, target);
  if (!targetEntity) {
    return {
      ...state,
      playerPosition: target,
    };
  }

  // Single recursion level only: player can push one entity if destination is free.
  const pushDestination = addPosition(target, step);
  if (!isWalkableTile(tileAt(state, pushDestination))) {
    return state;
  }

  if (findSolidEntityAt(state, pushDestination)) {
    return state;
  }

  const nextEntities = state.entities.map((entity) =>
    entity.id === targetEntity.id
      ? { ...entity, position: pushDestination }
      : entity,
  );

  return {
    ...state,
    playerPosition: target,
    entities: nextEntities,
  };
}
