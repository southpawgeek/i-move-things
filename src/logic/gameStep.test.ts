import { describe, expect, it } from "vitest";
import { movePlayer as movePlayerAction } from "../store/actions";
import { gameStep } from "./gameStep";
import { makeEntity, makeMachine, makeState } from "../test/testState";
import type { TileType } from "./types";

describe("gameStep", () => {
  it("applies sprayer and keeps spawned puddle for this turn", () => {
    const sprayer = makeMachine("sprayer-1", "sprayer", { x: 1, y: 2 }, "right");
    const state = makeState({
      machines: [sprayer],
      playerPosition: { x: 2, y: 2 },
    });

    const next = gameStep(state, movePlayerAction("left"));
    const puddle = next.entities.find((entity) => entity.kind === "puddle");

    expect(puddle?.position).toEqual({ x: 2, y: 2 });
    expect(next.moveCount).toBe(1);
  });

  it("decays puddles after one turn when not refreshed", () => {
    const state = makeState({
      entities: [makeEntity("p1", "puddle", { x: 2, y: 2 })],
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.entities.some((entity) => entity.kind === "puddle")).toBe(false);
  });

  it("runs sprayer before freezer so new puddles freeze immediately", () => {
    const sprayer = makeMachine("sprayer-1", "sprayer", { x: 1, y: 2 }, "right");
    const freezer = makeMachine("freezer-1", "freezer", { x: 1, y: 2 }, "right");
    const state = makeState({
      machines: [freezer, sprayer],
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.tiles[2]?.[2]).toBe("ice");
    expect(
      next.entities.some(
        (entity) =>
          entity.kind === "puddle" && entity.position.x === 2 && entity.position.y === 2,
      ),
    ).toBe(false);
  });

  it("fan pushes adjacent box one tile in facing direction", () => {
    const fan = makeMachine("fan-1", "fan", { x: 1, y: 2 }, "right");
    const box = makeEntity("box-1", "box", { x: 2, y: 2 });
    const state = makeState({
      machines: [fan],
      entities: [box],
      playerPosition: { x: 3, y: 3 },
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.entities.find((entity) => entity.id === "box-1")?.position).toEqual({
      x: 3,
      y: 2,
    });
  });

  it("fan fills hole when pushing debris into it", () => {
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
    expect(next.entities.some((entity) => entity.id === "debris-1")).toBe(false);
  });

  it("player can push fan and fan immediately moves debris", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const fan = makeMachine("fan-1", "fan", { x: 2, y: 2 }, "down");
    const debris = makeEntity("debris-1", "debris", { x: 3, y: 3 });
    const state = makeState({
      tiles,
      playerPosition: { x: 1, y: 2 },
      machines: [fan],
      entities: [debris],
    });

    const next = gameStep(state, movePlayerAction("right"));

    expect(next.machines.find((machine) => machine.id === "fan-1")?.position).toEqual({
      x: 3,
      y: 2,
    });
    expect(next.entities.find((entity) => entity.id === "debris-1")?.position).toEqual({
      x: 3,
      y: 4,
    });
  });

  it("reverts frozen puddle to puddle when freezer no longer exists", () => {
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "ice", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall"],
    ];
    const state = makeState({
      tiles,
      frozenPuddles: [
        {
          machineId: "freezer-missing",
          position: { x: 2, y: 2 },
          baseTile: "floor",
        },
      ],
    });

    const next = gameStep(state, movePlayerAction("left"));

    expect(next.tiles[2]?.[2]).toBe("floor");
    expect(
      next.entities.some(
        (entity) =>
          entity.kind === "puddle" && entity.position.x === 2 && entity.position.y === 2,
      ),
    ).toBe(true);
  });

  it("blocks player movement into hole tiles from level-02 layout", () => {
    // Level-02 row 3: floor floor hole hole floor
    // Player at (2,3) trying to move right into hole at (3,3)
    const tiles: TileType[][] = [
      ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
      ["wall", "floor", "floor", "floor", "wall", "goal", "floor", "floor", "wall"],
      ["wall", "floor", "wall", "wall", "wall", "wall", "wall", "floor", "wall"],
      ["wall", "floor", "floor", "hole", "hole", "floor", "floor", "floor", "wall"],
      ["wall", "floor", "wall", "wall", "floor", "wall", "wall", "floor", "wall"],
      ["wall", "floor", "floor", "floor", "floor", "floor", "wall", "floor", "wall"],
      ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
    ];
    const state = makeState({
      tiles,
      playerPosition: { x: 2, y: 3 },
    });

    const next = gameStep(state, movePlayerAction("right"));

    expect(next.playerPosition).toEqual({ x: 2, y: 3 });
    expect(next.status).toBe("playing");
  });
});
