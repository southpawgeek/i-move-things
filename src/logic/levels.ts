import type { GameState, LevelDefinition } from "./types";
import { cloneTiles } from "./grid";

/** Minimal dev level for Phase 1 wiring. */
export const DEV_LEVEL: LevelDefinition = {
  width: 5,
  height: 5,
  tiles: [
    ["wall", "wall", "wall", "wall", "wall"],
    ["wall", "floor", "floor", "floor", "wall"],
    ["wall", "floor", "goal", "floor", "wall"],
    ["wall", "floor", "floor", "floor", "wall"],
    ["wall", "wall", "wall", "wall", "wall"],
  ],
  playerStart: { x: 2, y: 3 },
  entities: [],
  machines: [],
};

export function createInitialState(
  level: LevelDefinition = DEV_LEVEL,
  levelIndex = 0,
): GameState {
  const entities = level.entities.map((entity, index) => ({
    ...entity,
    id: `entity-${index}`,
  }));
  const machines = level.machines.map((machine, index) => ({
    ...machine,
    id: `machine-${index}`,
  }));

  return {
    level,
    levelIndex,
    tiles: cloneTiles(level.tiles),
    playerPosition: level.playerStart,
    entities,
    machines,
    frozenPuddles: [],
    nextEntityId: entities.length,
    moveCount: 0,
    status: "playing",
  };
}
