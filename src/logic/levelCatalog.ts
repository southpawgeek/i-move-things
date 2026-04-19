import begin from "../levels/begin.json"
import holes from "../levels/holes.json"
import fanHoles from "../levels/fan-holes.json"
import level01 from "../levels/level-01.json"
import level02 from "../levels/level-02.json"
import type { LevelDefinition, TileType } from "./types"

const TILE_SYMBOL_MAP = {
  "🟥": "wall",
  "🟦": "floor",
  "🟩": "goal",
  "⬛": "hole",
  "🧊": "ice",
  W: "wall",
  F: "floor",
  G: "goal",
  I: "ice",
  H: "hole"
} as const satisfies Record<string, TileType>

const TILE_SYMBOLS = new Set(Object.keys(TILE_SYMBOL_MAP))
const ENTITY_KINDS = new Set(["box", "debris", "puddle"])
const MACHINE_TYPES = new Set(["fan", "sprayer", "freezer"])
const DIRECTIONS = new Set(["up", "down", "left", "right"])

type JsonLevelDefinition = Omit<LevelDefinition, "tiles"> & {
  tiles: string[][]
}

function assertLevelDefinition(
  level: unknown
): asserts level is JsonLevelDefinition {
  const candidate = level as Partial<JsonLevelDefinition>
  if (
    !candidate ||
    typeof candidate.width !== "number" ||
    typeof candidate.height !== "number" ||
    !Array.isArray(candidate.tiles) ||
    !candidate.playerStart ||
    typeof candidate.playerStart.x !== "number" ||
    typeof candidate.playerStart.y !== "number" ||
    !Array.isArray(candidate.entities) ||
    !Array.isArray(candidate.machines)
  ) {
    throw new Error("Invalid level JSON format.")
  }

  for (const row of candidate.tiles) {
    if (!Array.isArray(row)) throw new Error("Invalid tile row.")
    for (const tileSymbol of row) {
      if (!TILE_SYMBOLS.has(tileSymbol)) {
        throw new Error(`Invalid tile symbol: ${String(tileSymbol)}`)
      }
    }
  }

  for (const entity of candidate.entities) {
    if (
      !ENTITY_KINDS.has(entity.kind) ||
      typeof entity.position?.x !== "number" ||
      typeof entity.position?.y !== "number"
    ) {
      throw new Error("Invalid entity definition.")
    }
  }

  for (const machine of candidate.machines) {
    if (
      !MACHINE_TYPES.has(machine.type) ||
      !DIRECTIONS.has(machine.facing) ||
      typeof machine.position?.x !== "number" ||
      typeof machine.position?.y !== "number"
    ) {
      throw new Error("Invalid machine definition.")
    }
  }
}

function parseLevel(level: unknown): LevelDefinition {
  assertLevelDefinition(level)

  return {
    ...level,
    tiles: level.tiles.map((row) =>
      row.map(
        (symbol) => TILE_SYMBOL_MAP[symbol as keyof typeof TILE_SYMBOL_MAP]
      )
    )
  }
}

export { parseLevel }

/**
 * Define which levels to play and in what order.
 * Add/remove entries to control the level sequence.
 */
export const LEVEL_CONFIG: { name: string; level: LevelDefinition }[] = [
  { name: "You Move Things", level: parseLevel(begin) },
  { name: "Box Goes Away", level: parseLevel(holes) },
  { name: "Blow It Away", level: parseLevel(fanHoles) },
  { name: "Machines I", level: parseLevel(level01) },
  { name: "Machines II", level: parseLevel(level02) }
]

export const LEVELS: LevelDefinition[] = LEVEL_CONFIG.map((c) => c.level)
