import { useEffect, useRef, useCallback, useMemo, type ReactElement } from "react";
import { movePlayer } from "../store/actions";
import { useGame } from "../store/GameContext";
import type { Direction, Entity, GameState, Machine, TileType } from "../logic/types";

const TILE_SIZE = 48;

type MachineGraphics = {
  base: string;
  arrow: string;
};

function tileColor(tile: TileType): string {
  switch (tile) {
    case "wall":
      return "#334155";
    case "goal":
      return "#f59e0b";
    case "ice":
      return "#93c5fd";
    case "hole":
      return "#1e293b";
    case "floor":
    default:
      return "#0f172a";
  }
}

function entityColor(entity: Entity): string {
  switch (entity.kind) {
    case "box":
      return "#92400e";
    case "debris":
      return "#6b7280";
    case "puddle":
      return "#38bdf8";
    default:
      return "#ffffff";
  }
}

function machineColor(type: Machine["type"]): string {
  switch (type) {
    case "sprayer":
      return "#14b8a6";
    case "freezer":
      return "#3b82f6";
    case "fan":
    default:
      return "#fb923c";
  }
}

function machineArrowPoints(facing: Machine["facing"]): string {
  const min = 10;
  const max = TILE_SIZE - 10;
  const mid = TILE_SIZE / 2;

  switch (facing) {
    case "up":
      return `M${mid},${min} L${max},${max} L${min},${max} Z`;
    case "down":
      return `M${min},${min} L${max},${min} L${mid},${max} Z`;
    case "left":
      return `M${min},${mid} L${max},${min} L${max},${max} Z`;
    case "right":
    default:
      return `M${min},${min} L${max},${min} L${min},${max} Z`;
  }
}

function keyToDirection(key: string): Direction | null {
  switch (key) {
    case "ArrowUp":
    case "w":
    case "W":
      return "up";
    case "ArrowDown":
    case "s":
    case "S":
      return "down";
    case "ArrowLeft":
    case "a":
    case "A":
      return "left";
    case "ArrowRight":
    case "d":
    case "D":
      return "right";
    default:
      return null;
  }
}

export function GameCanvas(): ReactElement {
  const { state, dispatch } = useGame();
  const hostRef = useRef<HTMLDivElement | null>(null);

  // Keyboard input
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const direction = keyToDirection(event.key);
      if (!direction) return;

      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }
      if (event.repeat) return;
      if (state.status === "won") return;

      dispatch(movePlayer(direction));
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dispatch, state.status]);

  // Grid dimensions and tile data
  const { width, height } = state.level;
  const tiles = state.tiles;

  // Memoized tile grid
  const tileGrid = useMemo(() => {
    const grid: (TileType | undefined)[][] = [];
    for (let y = 0; y < height; y++) {
      const row: (TileType | undefined)[] = [];
      for (let x = 0; x < width; x++) {
        row.push(tiles[y]?.[x]);
      }
      grid.push(row);
    }
    return grid;
  }, [width, height, tiles]);

  // Memoized tile elements
  const tileElements = useMemo(() => {
    const elements: ReactElement[] = [];
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tileGrid[y]?.[x];
        if (!tile) continue;
        elements.push(
          <div
            key={`tile-${x}-${y}`}
            style={{
              position: "absolute",
              left: x * TILE_SIZE,
              top: y * TILE_SIZE,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: tileColor(tile),
              border: "1px solid #1f2937",
              boxSizing: "border-box",
            }}
          />
        );
      }
    }
    return elements;
  }, [height, width, tileGrid]);

  // Memoized machine elements
  const machineElements = useMemo(() => {
    const elements: ReactElement[] = [];
    for (const machine of state.machines) {
      elements.push(
        <div
          key={`machine-${machine.id}`}
          style={{
            position: "absolute",
            left: machine.position.x * TILE_SIZE,
            top: machine.position.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            transition: "left 0.1s ease, top 0.1s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 2,
              left: 2,
              width: TILE_SIZE - 4,
              height: TILE_SIZE - 4,
              backgroundColor: machineColor(machine.type),
              border: "1px solid #111827",
              boxSizing: "border-box",
            }}
          />
          <svg
            width={TILE_SIZE}
            height={TILE_SIZE}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
            }}
          >
            <path d={machineArrowPoints(machine.facing)} fill="#111827" />
          </svg>
        </div>,
      );
    }
    return elements;
  }, [state.machines]);

  // Memoized entity elements
  const entityElements = useMemo(() => {
    const elements: ReactElement[] = [];
    for (const entity of state.entities) {
      const isPuddle = entity.kind === "puddle";
      elements.push(
        <div
          key={`entity-${entity.id}`}
          style={{
            position: "absolute",
            left: entity.position.x * TILE_SIZE,
            top: entity.position.y * TILE_SIZE,
            width: TILE_SIZE,
            height: TILE_SIZE,
            transition: "left 0.1s ease, top 0.1s ease",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: isPuddle ? 8 : 4,
              left: isPuddle ? 8 : 4,
              width: isPuddle ? TILE_SIZE - 16 : TILE_SIZE - 8,
              height: isPuddle ? TILE_SIZE - 16 : TILE_SIZE - 8,
              backgroundColor: entityColor(entity),
              border: `1px solid ${isPuddle ? "#0c4a6e" : "#111827"}`,
              boxSizing: "border-box",
            }}
          />
        </div>,
      );
    }
    return elements;
  }, [state.entities]);

  // Player element
  const playerElement = useMemo(
    () => (
      <div
        style={{
          position: "absolute",
          left: state.playerPosition.x * TILE_SIZE,
          top: state.playerPosition.y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          transition: "left 0.1s ease, top 0.1s ease",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: TILE_SIZE - 12,
            height: TILE_SIZE - 12,
            backgroundColor: "#22c55e",
            border: "1px solid #052e16",
            boxSizing: "border-box",
          }}
        />
      </div>
    ),
    [state.playerPosition],
  );

  return (
    <div
      ref={hostRef}
      style={{
        position: "relative",
        width: width * TILE_SIZE,
        height: height * TILE_SIZE,
        minWidth: "100%",
        minHeight: "360px",
        display: "grid",
        placeItems: "center",
        border: "1px solid #1f2937",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#020617",
      }}
    >
      {tileElements}
      {machineElements}
      {entityElements}
      {playerElement}
    </div>
  );
}
