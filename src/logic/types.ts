/** Cardinal directions for movement and machine facing. */
export type Direction = "up" | "down" | "left" | "right";

/** Static grid cell kinds. */
export type TileType = "floor" | "wall" | "goal" | "ice";

export interface Position {
  x: number;
  y: number;
}

export type EntityKind = "player" | "box" | "debris" | "puddle";

/** Dynamic objects on the grid (player is tracked separately in GameState). */
export interface Entity {
  id: string;
  kind: Exclude<EntityKind, "player">;
  position: Position;
}

export type MachineType = "fan" | "sprayer" | "freezer";

export interface Machine {
  id: string;
  type: MachineType;
  position: Position;
  facing: Direction;
}

/** Authoring-time level data (immutable per level). */
export interface LevelDefinition {
  width: number;
  height: number;
  /** Row-major: tiles[y][x] */
  tiles: TileType[][];
  entities: Omit<Entity, "id">[];
  machines: Omit<Machine, "id">[];
}

export type GameStatus = "playing" | "won";

export interface FrozenPuddle {
  position: Position;
  machineId: string;
  baseTile: Exclude<TileType, "ice">;
}

export interface GameState {
  level: LevelDefinition;
  /** Runtime tile state (copied from level definition, then mutated by machines). */
  tiles: TileType[][];
  playerPosition: Position;
  entities: Entity[];
  machines: Machine[];
  frozenPuddles: FrozenPuddle[];
  nextEntityId: number;
  moveCount: number;
  status: GameStatus;
}

export interface MachineStepContext {
  refreshedPuddleKeys: Set<string>;
}

export type MachineEffect = (
  state: GameState,
  machine: Machine,
  context: MachineStepContext,
) => GameState;
