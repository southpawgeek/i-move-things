import type { Direction, Entity, GameState, Position } from "./types";
import { DELTA, addPosition, isWalkableTile, tileAt } from "./grid";
import { resolveHoleFill } from "./hole";

const PLAYER_PUSHABLE_ENTITY_KINDS: ReadonlySet<Entity["kind"]> = new Set(["box"]);

function findSolidEntityAt(state: GameState, pos: Position): Entity | undefined {
  return state.entities.find(
    (entity) =>
      entity.position.x === pos.x &&
      entity.position.y === pos.y &&
      PLAYER_PUSHABLE_ENTITY_KINDS.has(entity.kind),
  );
}

function findBlockingEntityAt(state: GameState, pos: Position): Entity | undefined {
  return state.entities.find(
    (entity) =>
      entity.position.x === pos.x &&
      entity.position.y === pos.y &&
      (entity.kind === "box" || entity.kind === "debris"),
  );
}

function findEntityAt(state: GameState, pos: Position): Entity | undefined {
  return state.entities.find(
    (entity) => entity.position.x === pos.x && entity.position.y === pos.y,
  );
}

function findMachineAt(state: GameState, pos: Position) {
  return state.machines.find(
    (machine) => machine.position.x === pos.x && machine.position.y === pos.y,
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
  const targetMachine = findMachineAt(state, target);

  if (!targetEntity && !targetMachine) {
    // Debris blocks movement but cannot be player-pushed.
    if (findEntityAt(state, target)?.kind === "debris") {
      return state;
    }
    return {
      ...state,
      playerPosition: target,
    };
  }

  // Single recursion level only: player can push one entity if destination is free.
  const pushDestination = addPosition(target, step);
  const destinationTile = tileAt(state, pushDestination);

  if (findBlockingEntityAt(state, pushDestination) || findMachineAt(state, pushDestination)) {
    return state;
  }

  let nextEntities = state.entities;
  let nextTiles = state.tiles;

  if (targetEntity) {
    if (!isWalkableTile(destinationTile)) {
      const holeResolved = resolveHoleFill(state, targetEntity.id, pushDestination);
      if (!holeResolved) {
        return state;
      }
      nextEntities = holeResolved.entities;
      nextTiles = holeResolved.tiles;
    } else {
      nextEntities = state.entities.map((entity) =>
        entity.id === targetEntity.id
          ? { ...entity, position: pushDestination }
          : entity,
      );
    }
  } else if (!isWalkableTile(destinationTile)) {
    return state;
  }

  const nextMachines = targetMachine
    ? state.machines.map((machine) =>
        machine.id === targetMachine.id
          ? { ...machine, position: pushDestination }
          : machine,
      )
    : state.machines;

  return {
    ...state,
    playerPosition: target,
    entities: nextEntities,
    tiles: nextTiles,
    machines: nextMachines,
  };
}
