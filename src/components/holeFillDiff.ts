import type { Entity, GameState, Position, TileType } from "../logic/types";

export type DetectedHoleFill = {
  entityId: string;
  entityKind: Entity["kind"];
  from: Position;
  hole: Position;
};

function manhattan(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function tileAt(tiles: TileType[][], x: number, y: number): TileType | undefined {
  return tiles[y]?.[x];
}

/**
 * Compares game state before and after a step to find hole fills: hole→floor
 * with a removed entity that was pushed from an adjacent cell.
 */
export function detectHoleFills(prev: GameState | null, next: GameState): DetectedHoleFill[] {
  if (!prev) {
    return [];
  }

  const { width, height } = next.level;
  const filledHoles: Position[] = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (tileAt(prev.tiles, x, y) === "hole" && tileAt(next.tiles, x, y) === "floor") {
        filledHoles.push({ x, y });
      }
    }
  }

  if (filledHoles.length === 0) {
    return [];
  }

  const nextIds = new Set(next.entities.map((e) => e.id));
  const removed = prev.entities.filter((e) => !nextIds.has(e.id));

  filledHoles.sort((a, b) => (a.y !== b.y ? a.y - b.y : a.x - b.x));

  const usedEntityIds = new Set<string>();
  const results: DetectedHoleFill[] = [];

  for (const hole of filledHoles) {
    const adjacent = removed
      .filter((e) => !usedEntityIds.has(e.id) && manhattan(e.position, hole) === 1)
      .sort((a, b) => a.id.localeCompare(b.id));
    const entity = adjacent[0];
    if (!entity) {
      continue;
    }
    usedEntityIds.add(entity.id);
    results.push({
      entityId: entity.id,
      entityKind: entity.kind,
      from: entity.position,
      hole,
    });
  }

  return results;
}
