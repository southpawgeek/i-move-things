import type { Entity, GameState, LevelDefinition, Position, TileType } from "../logic/types";

const DEFAULT_TILES: TileType[][] = [
  ["wall", "wall", "wall", "wall", "wall"],
  ["wall", "floor", "floor", "floor", "wall"],
  ["wall", "floor", "floor", "floor", "wall"],
  ["wall", "floor", "floor", "floor", "wall"],
  ["wall", "wall", "wall", "wall", "wall"],
];

function cloneTiles(tiles: TileType[][]): TileType[][] {
  return tiles.map((row) => [...row]);
}

export function makeLevel(tiles: TileType[][] = DEFAULT_TILES): LevelDefinition {
  return {
    width: tiles[0].length,
    height: tiles.length,
    tiles: cloneTiles(tiles),
    entities: [],
    machines: [],
  };
}

export function makeEntity(
  id: string,
  kind: Entity["kind"],
  position: Position,
): Entity {
  return { id, kind, position };
}

export function makeState({
  tiles = DEFAULT_TILES,
  playerPosition = { x: 2, y: 2 },
  entities = [],
  moveCount = 0,
  status = "playing",
}: {
  tiles?: TileType[][];
  playerPosition?: Position;
  entities?: Entity[];
  moveCount?: number;
  status?: GameState["status"];
} = {}): GameState {
  return {
    level: makeLevel(tiles),
    playerPosition,
    entities,
    machines: [],
    moveCount,
    status,
  };
}
