import type { GameAction } from "../store/actions";
import { checkWinCondition } from "./checkWinCondition";
import { positionKey } from "./grid";
import { machineRegistry } from "./machines/registry";
import { movePlayer } from "./movePlayer";
import type { Entity, GameState, MachineStepContext, MachineType } from "./types";

const MACHINE_ORDER: readonly MachineType[] = ["sprayer", "freezer", "fan"];

function hasPuddleAt(entities: Entity[], x: number, y: number): boolean {
  return entities.some(
    (entity) => entity.kind === "puddle" && entity.position.x === x && entity.position.y === y,
  );
}

function rehydratePuddlesFromRemovedFreezers(
  state: GameState,
  context: MachineStepContext,
): GameState {
  const activeFreezerIds = new Set(
    state.machines.filter((machine) => machine.type === "freezer").map((machine) => machine.id),
  );

  const staleFrozen = state.frozenPuddles.filter(
    (frozenPuddle) => !activeFreezerIds.has(frozenPuddle.machineId),
  );
  if (staleFrozen.length === 0) {
    return state;
  }

  const nextTiles = state.tiles.map((row) => [...row]);
  const nextEntities = [...state.entities];
  let nextEntityId = state.nextEntityId;

  for (const frozenPuddle of staleFrozen) {
    nextTiles[frozenPuddle.position.y][frozenPuddle.position.x] = frozenPuddle.baseTile;
    if (!hasPuddleAt(nextEntities, frozenPuddle.position.x, frozenPuddle.position.y)) {
      nextEntities.push({
        id: `puddle-${nextEntityId}`,
        kind: "puddle",
        position: frozenPuddle.position,
      });
      nextEntityId += 1;
    }
    context.refreshedPuddleKeys.add(positionKey(frozenPuddle.position));
  }

  return {
    ...state,
    tiles: nextTiles,
    entities: nextEntities,
    nextEntityId,
    frozenPuddles: state.frozenPuddles.filter(
      (frozenPuddle) => activeFreezerIds.has(frozenPuddle.machineId),
    ),
  };
}

function cleanupTransientEntities(state: GameState, context: MachineStepContext): GameState {
  return {
    ...state,
    entities: state.entities.filter((entity) => {
      if (entity.kind !== "puddle") {
        return true;
      }
      return context.refreshedPuddleKeys.has(positionKey(entity.position));
    }),
  };
}

function applyMachines(state: GameState, context: MachineStepContext): GameState {
  let current = rehydratePuddlesFromRemovedFreezers(state, context);

  for (const machineType of MACHINE_ORDER) {
    const machines = current.machines.filter((machine) => machine.type === machineType);
    for (const machine of machines) {
      const effect = machineRegistry[machine.type];
      current = effect(current, machine, context);
    }
  }

  return current;
}

export function gameStep(state: GameState, action: GameAction): GameState {
  if (action.type !== "MOVE_PLAYER") {
    return state;
  }

  const context: MachineStepContext = { refreshedPuddleKeys: new Set<string>() };

  const movedState = movePlayer(state, action.direction);
  const withMachines = applyMachines(movedState, context);
  const withCleanup = cleanupTransientEntities(withMachines, context);

  const turnState = {
    ...withCleanup,
    moveCount: withCleanup.moveCount + 1,
  };

  const won = checkWinCondition(turnState);
  if (turnState.status === (won ? "won" : "playing")) {
    return turnState;
  }

  return {
    ...turnState,
    status: won ? "won" : "playing",
  };
}
