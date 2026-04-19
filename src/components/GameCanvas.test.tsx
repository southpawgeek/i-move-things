// @vitest-environment jsdom
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { makeState } from "../test/testState";
import { GameCanvas } from "./GameCanvas";

let mockState = makeState();
const mockDispatch = vi.fn();

vi.mock("../store/GameContext", () => ({
  useGame: () => ({
    state: mockState,
    dispatch: mockDispatch,
  }),
}));

describe("GameCanvas", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockState = makeState();
  });

  afterEach(() => {
    cleanup();
  });

  it("mounts and renders the game grid", async () => {
    const { container } = render(<GameCanvas />);

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
