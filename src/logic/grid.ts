import type { Direction, GameState, Position, TileType } from "./types";

export const DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function addPosition(a: Position, b: Position): Position {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function positionKey(pos: Position): string {
  return `${pos.x},${pos.y}`;
}

export function samePosition(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y;
}

export function inBounds(state: GameState, pos: Position): boolean {
  return (
    pos.x >= 0 &&
    pos.y >= 0 &&
    pos.x < state.level.width &&
    pos.y < state.level.height
  );
}

export function tileAt(state: GameState, pos: Position): TileType | undefined {
  if (!inBounds(state, pos)) return undefined;
  return state.tiles[pos.y]?.[pos.x];
}

export function isWalkableTile(tile: TileType | undefined): boolean {
  return tile !== undefined && tile !== "wall" && tile !== "hole";
}

export function cloneTiles(tiles: TileType[][]): TileType[][] {
  return tiles.map((row) => [...row]);
}
