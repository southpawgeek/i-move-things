import { DELTA, addPosition, samePosition } from "../grid";
import type { FrozenPuddle, MachineEffect, TileType } from "../types";

export const freezerEffect: MachineEffect = (state, machine, _context) => {
  const target = addPosition(machine.position, DELTA[machine.facing]);
  const puddlesOnTarget = state.entities.filter(
    (entity) => entity.kind === "puddle" && samePosition(entity.position, target),
  );

  if (puddlesOnTarget.length === 0) {
    return state;
  }

  const nextEntities = state.entities.filter(
    (entity) => !(entity.kind === "puddle" && samePosition(entity.position, target)),
  );
  const nextTiles = state.tiles.map((row) => [...row]);
  const currentTile = nextTiles[target.y]?.[target.x];
  if (currentTile === undefined) {
    return state;
  }

  if (currentTile !== "ice") {
    nextTiles[target.y][target.x] = "ice";
  }

  const existing = state.frozenPuddles.find(
    (frozen) => samePosition(frozen.position, target) && frozen.machineId === machine.id,
  );
  const nextFrozenPuddles = existing
    ? state.frozenPuddles
    : [
        ...state.frozenPuddles,
        {
          position: target,
          machineId: machine.id,
          baseTile: (currentTile === "ice" ? "floor" : currentTile) as Exclude<TileType, "ice">,
        } satisfies FrozenPuddle,
      ];

  return {
    ...state,
    entities: nextEntities,
    tiles: nextTiles,
    frozenPuddles: nextFrozenPuddles,
  };
};
