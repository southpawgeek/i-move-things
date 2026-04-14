import { DELTA, addPosition, isWalkableTile, positionKey, tileAt } from "../grid";
import type { Entity, MachineEffect, Position } from "../types";

function hasPuddleAt(entities: Entity[], pos: Position): boolean {
  return entities.some(
    (entity) =>
      entity.kind === "puddle" &&
      entity.position.x === pos.x &&
      entity.position.y === pos.y,
  );
}

export const sprayerEffect: MachineEffect = (state, machine, context) => {
  const target = addPosition(machine.position, DELTA[machine.facing]);
  if (!isWalkableTile(tileAt(state, target))) {
    return state;
  }

  context.refreshedPuddleKeys.add(positionKey(target));
  if (hasPuddleAt(state.entities, target)) {
    return state;
  }

  const puddle: Entity = {
    id: `puddle-${state.nextEntityId}`,
    kind: "puddle",
    position: target,
  };

  return {
    ...state,
    entities: [...state.entities, puddle],
    nextEntityId: state.nextEntityId + 1,
  };
};
