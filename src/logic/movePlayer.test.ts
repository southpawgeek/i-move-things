import { describe, expect, it } from "vitest";
import { movePlayer } from "./movePlayer";
import { makeEntity, makeState } from "../test/testState";

describe("movePlayer", () => {
  it("moves onto walkable floor tile", () => {
    const state = makeState({ playerPosition: { x: 2, y: 2 } });

    const next = movePlayer(state, "right");

    expect(next.playerPosition).toEqual({ x: 3, y: 2 });
    expect(next.moveCount).toBe(1);
  });

  it("blocks movement into wall", () => {
    const state = makeState({ playerPosition: { x: 1, y: 1 } });

    const next = movePlayer(state, "left");

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
    expect(next.moveCount).toBe(1);
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
    const debris = makeEntity("debris-1", "debris", { x: 3, y: 2 });
    const state = makeState({
      playerPosition: { x: 1, y: 2 },
      entities: [box, debris],
    });

    const next = movePlayer(state, "right");

    expect(next).toBe(state);
  });
});
