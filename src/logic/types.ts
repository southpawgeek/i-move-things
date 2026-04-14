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

export interface GameState {
  level: LevelDefinition;
  playerPosition: Position;
  entities: Entity[];
  machines: Machine[];
  moveCount: number;
  status: GameStatus;
}

export type MachineEffect = (state: GameState, machine: Machine) => GameState;
