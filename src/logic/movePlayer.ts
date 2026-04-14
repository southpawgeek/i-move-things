import type { Direction, Entity, GameState, Position, TileType } from "./types";

const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const PUSHABLE_KINDS: ReadonlySet<Entity["kind"]> = new Set(["box", "debris"]);

function add(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

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
  return state.level.tiles[pos.y]?.[pos.x];
}

function isWalkableTile(tile: TileType | undefined): boolean {
  return tile !== undefined && tile !== "wall";
}

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
  const target = add(state.playerPosition, step);
  const targetTile = tileAt(state, target);

  if (!isWalkableTile(targetTile)) {
    return state;
  }

  const targetEntity = findSolidEntityAt(state, target);
  if (!targetEntity) {
    return {
      ...state,
      playerPosition: target,
      moveCount: state.moveCount + 1,
    };
  }

  // Single recursion level only: player can push one entity if destination is free.
  const pushDestination = add(target, step);
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
    moveCount: state.moveCount + 1,
  };
}
