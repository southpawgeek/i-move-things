import { describe, expect, it } from "vitest";
import { checkWinCondition } from "./checkWinCondition";
import { makeState } from "../test/testState";

describe("checkWinCondition", () => {
  it("returns true when player stands on goal", () => {
    const tiles = [
      ["wall", "wall", "wall"],
      ["wall", "goal", "wall"],
      ["wall", "wall", "wall"],
    ] as const;
    const state = makeState({
      // Cast is safe for tests where tile literals are intentionally narrow.
      tiles: tiles as unknown as ("floor" | "wall" | "goal" | "ice")[][],
      playerPosition: { x: 1, y: 1 },
    });

    expect(checkWinCondition(state)).toBe(true);
  });

  it("returns false when player is not on goal", () => {
    const state = makeState({ playerPosition: { x: 2, y: 2 } });

    expect(checkWinCondition(state)).toBe(false);
  });
});
