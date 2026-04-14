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

vi.mock("pixi.js", () => {
  class Graphics {
    public x = 0;
    public y = 0;

    clear() {
      return this;
    }
    rect() {
      return this;
    }
    fill() {
      return this;
    }
    stroke() {
      return this;
    }
    poly() {
      return this;
    }
    destroy() {
      // no-op for tests
    }
  }

  class Container {
    public x = 0;
    public y = 0;
    private children: unknown[] = [];

    addChild(...children: unknown[]) {
      this.children.push(...children);
      return children[0];
    }
    removeChild(child: unknown) {
      this.children = this.children.filter((current) => current !== child);
      return child;
    }
    destroy() {
      this.children = [];
    }
  }

  class Application {
    public stage = new Container();
    public canvas = document.createElement("canvas");
    public ticker = {
      add: vi.fn(),
    };

    async init() {
      return;
    }

    destroy() {
      return;
    }
  }

  return { Application, Container, Graphics };
});

describe("GameCanvas", () => {
  beforeEach(() => {
    mockDispatch.mockReset();
    mockState = makeState();
  });

  afterEach(() => {
    cleanup();
  });

  it("mounts and appends a canvas", async () => {
    const { container } = render(<GameCanvas />);

    await waitFor(() => {
      expect(container.querySelector("canvas")).not.toBeNull();
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
