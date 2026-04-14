import { describe, expect, it } from "vitest";
import { movePlayer } from "./movePlayer";
import { makeEntity, makeMachine, makeState } from "../test/testState";
import type { TileType } from "./types";

describe("movePlayer", () => {
  it("moves onto walkable floor tile", () => {
    const state = makeState({ playerPosition: { x: 2, y: 2 } });

    const next = movePlayer(state, "right");

    expect(next.playerPosition).toEqual({ x: 3, y: 2 });
    expect(next.moveCount).toBe(0);
  });

  it("blocks movement into wall", () => {
    const state = makeState({ playerPosition: { x: 1, y: 1 } });

    const next = movePlayer(state, "left");

    expect(next).toBe(state);
  });

  it("blocks movement into hole", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "hole", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall"],
    ];
    const state = makeState({
      tiles,
      playerPosition: { x: 1, y: 2 },
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });

  it("pushes a box one tile when destination is free", () => {
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const state = makeState({
      playerPosition: { x: 1, y: 2 },
      entities: [box],
    });

    const next = movePlayer(state, "right");

    expect(next.playerPosition).toEqual({ x: 2, y: 2 });
    expect(next.entities[0]?.position).toEqual({ x: 3, y: 2 });
    expect(next.moveCount).toBe(0);
  });

  it("does not push box into wall", () => {
    const box = makeEntity("box-1", "box", { x: 3, y: 1 });
    const state = makeState({
      playerPosition: { x: 2, y: 1 },
      entities: [box],
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });

  it("does not push chain of two entities", () => {
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const box2 = makeEntity("box-2", "box", { x: 3, y: 2 });
    const state = makeState({
      playerPosition: { x: 1, y: 2 },
      entities: [box, box2],
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });

  it("fills a hole when pushing box into it", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "hole", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const state = makeState({
      tiles,
      playerPosition: { x: 1, y: 2 },
      entities: [box],
    });

    const next = movePlayer(state, "right");

    expect(next.playerPosition).toEqual({ x: 2, y: 2 });
    expect(next.entities.some((entity) => entity.id === "box-1")).toBe(false);
    expect(next.tiles[2]?.[3]).toBe("floor");
  });

  it("cannot push debris", () => {
    const debris = makeEntity("debris-1", "debris", { x: 2, y: 2 });
    const state = makeState({
      playerPosition: { x: 1, y: 2 },
      entities: [debris],
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });

  it("pushes a machine one tile when destination is free", () => {
    const fan = makeMachine("fan-1", "fan", { x: 2, y: 2 }, "right");
    const state = makeState({
      playerPosition: { x: 1, y: 2 },
      machines: [fan],
    });

    const next = movePlayer(state, "right");

    expect(next.playerPosition).toEqual({ x: 2, y: 2 });
    expect(next.machines[0]?.position).toEqual({ x: 3, y: 2 });
  });

  it("cannot move through machine if it cannot be pushed", () => {
    const fan = makeMachine("fan-1", "fan", { x: 3, y: 1 }, "right");
    const state = makeState({
      playerPosition: { x: 2, y: 1 },
      machines: [fan],
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });
});
