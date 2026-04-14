import type {
  Entity,
  FrozenPuddle,
  GameState,
  LevelDefinition,
  Machine,
  Position,
  TileType,
} from "../logic/types";

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
    playerStart: { x: 2, y: 2 },
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

export function makeMachine(
  id: string,
  type: Machine["type"],
  position: Position,
  facing: Machine["facing"],
): Machine {
  return { id, type, position, facing };
}

export function makeState({
  tiles = DEFAULT_TILES,
  playerPosition = { x: 2, y: 2 },
  entities = [],
  machines = [],
  frozenPuddles = [],
  nextEntityId,
  moveCount = 0,
  status = "playing",
  levelIndex = 0,
}: {
  tiles?: TileType[][];
  playerPosition?: Position;
  entities?: Entity[];
  machines?: Machine[];
  frozenPuddles?: FrozenPuddle[];
  nextEntityId?: number;
  moveCount?: number;
  status?: GameState["status"];
  levelIndex?: number;
} = {}): GameState {
  return {
    level: makeLevel(tiles),
    levelIndex,
    tiles: cloneTiles(tiles),
    playerPosition,
    entities,
    machines,
    frozenPuddles,
    nextEntityId: nextEntityId ?? entities.length,
    moveCount,
    status,
  };
}
