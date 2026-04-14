import { describe, expect, it } from "vitest";
import { gameReducer } from "./gameReducer";
import { loadLevel, movePlayer, restartLevel } from "./actions";
import { makeState } from "../test/testState";
import type { LevelDefinition, TileType } from "../logic/types";

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

  it("restarts current level from initial state", () => {
    const state = makeState({
      moveCount: 9,
      status: "won",
      playerPosition: { x: 3, y: 3 },
      levelIndex: 1,
    });

    const next = gameReducer(state, restartLevel());

    expect(next.levelIndex).toBe(1);
    expect(next.moveCount).toBe(0);
    expect(next.status).toBe("playing");
    expect(next.playerPosition).toEqual(state.level.playerStart);
  });

  it("loads selected level index and resets turn state", () => {
    const level: LevelDefinition = {
      width: 3,
      height: 3,
      tiles: [
        ["wall", "wall", "wall"],
        ["wall", "goal", "wall"],
        ["wall", "wall", "wall"],
      ],
      playerStart: { x: 1, y: 1 },
      entities: [],
      machines: [],
    };
    const state = makeState({ moveCount: 4, status: "won" });

    const next = gameReducer(state, loadLevel(3, level));

    expect(next.levelIndex).toBe(3);
    expect(next.level).toEqual(level);
    expect(next.playerPosition).toEqual({ x: 1, y: 1 });
    expect(next.moveCount).toBe(0);
    expect(next.status).toBe("playing");
  });
});
