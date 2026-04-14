import { describe, expect, it } from "vitest";
import { gameReducer } from "./gameReducer";
import { movePlayer } from "./actions";
import { makeState } from "../test/testState";
import type { TileType } from "../logic/types";

describe("gameReducer", () => {
  it("sets status to won when move ends on goal", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall"],
      ["wall", "floor", "goal", "wall"],
      ["wall", "wall", "wall", "wall"],
    ];
    const state = makeState({
      tiles,
      playerPosition: { x: 1, y: 1 },
    });

    const next = gameReducer(state, movePlayer("right"));

    expect(next.playerPosition).toEqual({ x: 2, y: 1 });
    expect(next.status).toBe("won");
    expect(next.moveCount).toBe(1);
  });

  it("counts blocked input as a turn", () => {
    const state = makeState({
      playerPosition: { x: 1, y: 1 },
      moveCount: 2,
      status: "playing",
    });

    const next = gameReducer(state, movePlayer("left"));

    expect(next).not.toBe(state);
    expect(next.moveCount).toBe(3);
    expect(next.status).toBe("playing");
    expect(next.playerPosition).toEqual({ x: 1, y: 1 });
  });
});
