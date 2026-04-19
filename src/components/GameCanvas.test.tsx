// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TileType } from "../logic/types";
import { makeState } from "../test/testState";
import { exposesWallPacEdge, GameCanvas, WALL_PAC_BORDER, wallPacTileOutlineStyle } from "./GameCanvas";

let mockState = makeState();
const mockDispatch = vi.fn();

vi.mock("../store/GameContext", () => ({
  useGame: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

describe("wallPacTileOutlineStyle", () => {
  it("sets only sides facing floor, hole, or goal (not off-map)", () => {
    const grid: TileType[][] = [
      ["wall", "wall", "wall"],
      ["wall", "wall", "floor"],
      ["wall", "wall", "wall"],
    ];
    const sides = wallPacTileOutlineStyle(grid, 1, 1, 3, 3);
    expect(sides.borderRight).toBe(WALL_PAC_BORDER);
    expect(sides.borderTop).toBe("none");
    expect(sides.borderBottom).toBe("none");
    expect(sides.borderLeft).toBe("none");
  });

  it("keeps square corners so straight wall runs do not read as circles", () => {
    const grid: TileType[][] = [
      ["wall", "wall", "wall"],
      ["wall", "wall", "floor"],
      ["wall", "wall", "wall"],
    ];
    const s = wallPacTileOutlineStyle(grid, 1, 1, 3, 3);
    expect(s.borderTopLeftRadius).toBe(0);
    expect(s.borderTopRightRadius).toBe(0);
    expect(s.borderBottomRightRadius).toBe(0);
    expect(s.borderBottomLeftRadius).toBe(0);
  });

  it("uses square corners on L-shaped wall joins", () => {
    const grid: TileType[][] = [
      ["floor", "floor", "floor"],
      ["floor", "wall", "wall"],
      ["floor", "wall", "wall"],
    ];
    const s = wallPacTileOutlineStyle(grid, 1, 1, 3, 3);
    expect(s.borderTop).toBe(WALL_PAC_BORDER);
    expect(s.borderLeft).toBe(WALL_PAC_BORDER);
    expect(s.borderTopLeftRadius).toBe(0);
    expect(s.borderTopRightRadius).toBe(0);
    expect(s.borderBottomLeftRadius).toBe(0);
  });

  it("does not expose edges between two walls", () => {
    expect(exposesWallPacEdge("wall")).toBe(false);
  });

  it("exposes edges toward floor, hole, and goal", () => {
    expect(exposesWallPacEdge("floor")).toBe(true);
    expect(exposesWallPacEdge("hole")).toBe(true);
    expect(exposesWallPacEdge("goal")).toBe(true);
  });

  it("does not expose toward ice", () => {
    expect(exposesWallPacEdge("ice")).toBe(false);
  });

  it("does not expose off-map neighbors", () => {
    expect(exposesWallPacEdge(undefined)).toBe(false);
  });
});

describe("GameCanvas", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockState = makeState();
  });

  afterEach(() => {
    cleanup();
  });

  it("mounts and renders the game grid", async () => {
    const { container } = render(<GameCanvas hasNextLevel={true} />);

    await waitFor(() => {
      expect(container.querySelector("[style*='position: absolute']")).not.toBeNull();
    });
  });

  it("dispatches MOVE_PLAYER when pressing movement keys", async () => {
    render(<GameCanvas />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "MOVE_PLAYER",
        direction: "right",
      });
    });
  });

  it("does not dispatch movement when game is won", async () => {
    mockState = makeState({ status: "won" });
    render(<GameCanvas />);

    fireEvent.keyDown(window, { key: "ArrowRight" });

    await waitFor(() => {
      expect(mockDispatch).not.toHaveBeenCalled();
    });
  });
});
