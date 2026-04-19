import { describe, expect, it } from "vitest";
import { gameStep } from "../logic/gameStep";
import { movePlayer as movePlayerAction } from "../store/actions";
import { makeEntity, makeMachine, makeState } from "../test/testState";
import type { TileType } from "../logic/types";

describe("gameStep machine interactions", () => {
  it("fan pushes debris into hole and fills it", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "hole", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 3 }, "right");
    const debris = makeEntity("debris-1", "debris", { x: 2, y: 3 });
    const state = makeState({
      tiles,
      machines: [fan],
      entities: [debris],
      playerPosition: { x: 1, y: 1 },
    });

    const next = gameStep(state, movePlayerAction("right"));

    expect(next.tiles[3]?.[3]).toBe("floor");
    expect(next.entities.some((e) => e.id === "debris-1")).toBe(false);
  });

  it("player can push machine into empty space", () => {
    const fan = makeMachine("fan-1", "fan", { x: 2, y: 2 }, "right");
    const state = makeState({
      machines: [fan],
      playerPosition: { x: 1, y: 2 },
    });

    const next = gameStep(state, movePlayerAction("right"));

    expect(next.machines[0]?.position).toEqual({ x: 3, y: 2 });
    expect(next.playerPosition).toEqual({ x: 2, y: 2 });
  });

  it("fan cannot push entity if destination is hole without entity to fill it", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "hole", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 2 }, "right");
    const state = makeState({
      tiles,
      machines: [fan],
      playerPosition: { x: 3, y: 3 },
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.machines[0]?.position).toEqual({ x: 1, y: 2 });
  });

  it("fan pushes box and player can push fan in same turn", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 2, y: 2 }, "down");
    const box = makeEntity("box-1", "box", { x: 3, y: 3 });
    const state = makeState({
      tiles,
      playerPosition: { x: 1, y: 2 },
      machines: [fan],
      entities: [box],
    });

    const next = gameStep(state, movePlayerAction("right"));

    expect(next.machines[0]?.position).toEqual({ x: 3, y: 2 });
    expect(next.entities.find((e) => e.id === "box-1")?.position).toEqual({
      x: 3,
      y: 4,
    });
  });

  it("fan cannot push entity if destination has another entity", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 2 }, "right");
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const box2 = makeEntity("box-2", "box", { x: 3, y: 2 });
    const state = makeState({
      tiles,
      machines: [fan],
      entities: [box, box2],
      playerPosition: { x: 3, y: 3 },
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.machines[0]?.position).toEqual({ x: 1, y: 2 });
    expect(next.entities.find((e) => e.id === "box-1")?.position).toEqual({
      x: 2,
      y: 2,
    });
  });

  it("fan cannot push entity off the grid", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "wall"],
      ["wall", "fan", "box", "wall"],
      ["wall", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 2 }, "right");
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const state = makeState({
      tiles,
      machines: [fan],
      entities: [box],
      playerPosition: { x: 3, y: 3 },
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.machines[0]?.position).toEqual({ x: 1, y: 2 });
    expect(next.entities.find((e) => e.id === "box-1")?.position).toEqual({
      x: 2,
      y: 2,
    });
  });

  it("fan respects player position and does not push into player", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 2 }, "right");
    const debris = makeEntity("debris-1", "debris", { x: 2, y: 2 });
    const state = makeState({
      tiles,
      machines: [fan],
      entities: [debris],
      playerPosition: { x: 3, y: 2 },
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.machines[0]?.position).toEqual({ x: 1, y: 2 });
    expect(next.entities.find((e) => e.id === "debris-1")?.position).toEqual({
      x: 2,
      y: 2,
    });
  });
});
