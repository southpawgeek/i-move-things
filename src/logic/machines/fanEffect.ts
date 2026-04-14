import { DELTA, addPosition, isWalkableTile, samePosition, tileAt } from "../grid";
import { resolveHoleFill } from "../hole";
import type { Entity, MachineEffect, Position } from "../types";

const FAN_PUSHABLE_KINDS: ReadonlySet<Entity["kind"]> = new Set(["box", "debris"]);

function findPushableAt(entities: Entity[], pos: Position): Entity | undefined {
  return entities.find(
    (entity) =>
      FAN_PUSHABLE_KINDS.has(entity.kind) &&
      entity.position.x === pos.x &&
      entity.position.y === pos.y,
  );
}

export const fanEffect: MachineEffect = (state, machine, _context) => {
  const step = DELTA[machine.facing];
  const target = addPosition(machine.position, step);

  if (samePosition(state.playerPosition, target)) {
    return state;
  }

  const entity = findPushableAt(state.entities, target);
  if (!entity) {
    return state;
  }

  const destination = addPosition(target, step);
  const destinationTile = tileAt(state, destination);
  if (samePosition(state.playerPosition, destination)) {
    return state;
  }
  if (findPushableAt(state.entities, destination)) {
    return state;
  }

  if (!isWalkableTile(destinationTile)) {
    const holeResolved = resolveHoleFill(state, entity.id, destination);
    if (!holeResolved) {
      return state;
    }
    return holeResolved;
  }

  return {
    ...state,
    entities: state.entities.map((current) =>
      current.id === entity.id ? { ...current, position: destination } : current,
    ),
  };
};
