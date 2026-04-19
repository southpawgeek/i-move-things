import { describe, expect, it } from "vitest";
import { makeEntity, makeState } from "../test/testState";
import type { TileType } from "../logic/types";
import { detectHoleFills } from "./holeFillDiff";

describe("detectHoleFills", () => {
  it("returns empty when prev is null", () => {
    const next = makeState();
    expect(detectHoleFills(null, next)).toEqual([]);
  });

  it("detects box pushed into hole (hole becomes floor, entity removed)", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "hole", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const box = makeEntity("box-1", "box", { x: 2, y: 3 });
    const prev = makeState({ tiles, entities: [box] });
    const nextTiles = tiles.map((row) => [...row]);
    nextTiles[3]![3] = "floor";
    const next = makeState({
      tiles: nextTiles,
      entities: [],
      moveCount: 1,
    });

    expect(detectHoleFills(prev, next)).toEqual([
      {
        entityId: "box-1",
        entityKind: "box",
        from: { x: 2, y: 3 },
        hole: { x: 3, y: 3 },
      },
    ]);
  });

  it("returns empty when no hole-to-floor change", () => {
    const prev = makeState({ entities: [makeEntity("b", "box", { x: 2, y: 2 })] });
    const next = makeState({
      entities: [makeEntity("b", "box", { x: 3, y: 2 })],
      moveCount: 1,
    });
    expect(detectHoleFills(prev, next)).toEqual([]);
  });
});
