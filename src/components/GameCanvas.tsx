import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { movePlayer } from "../store/actions";
import { useGame } from "../store/GameContext";
import type { Direction, Entity, Machine, TileType } from "../logic/types";
import { HoleFillOverlay } from "./HoleFillOverlay";
import { detectHoleFills } from "./holeFillDiff";

const TILE_SIZE = 48;

function tileColor(tile: TileType): string {
  switch (tile) {
    case "wall":
      return "#4c1d95";
    case "goal":
      return "#fbbf24";
    case "ice":
      return "#22d3ee";
    case "hole":
      return "#000000";
    case "floor":
    default:
      return "#1e1b4b";
  }
}

function entityColor(entity: Entity): string {
  switch (entity.kind) {
    case "box":
      return "#f97316";
    case "debris":
      return "#a78bfa";
    case "puddle":
      return "#22d3ee";
    default:
      return "#e879f9";
  }
}

function entityBorderColor(kind: Entity["kind"]): string {
  return kind === "puddle" ? "#0891b2" : "#7c3aed";
}

function machineColor(type: Machine["type"]): string {
  switch (type) {
    case "sprayer":
      return "#22d3ee";
    case "freezer":
      return "#818cf8";
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

type ActiveHoleFill = {
  key: string;
  entityId: string;
  entityKind: Entity["kind"];
  from: { x: number; y: number };
  hole: { x: number; y: number };
};

export function GameCanvas(): ReactElement {
  const { state, dispatch } = useGame();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const prevSnapshot = useRef<typeof state | null>(null);
  const prevMoveCountRef = useRef<number | null>(null);
  const blockHoleFillInputRef = useRef(false);
  const [activeHoleFills, setActiveHoleFills] = useState<ActiveHoleFill[]>([]);

  blockHoleFillInputRef.current = activeHoleFills.length > 0;

  const removeHoleFill = useCallback((key: string) => {
    setActiveHoleFills((items) => items.filter((item) => item.key !== key));
  }, []);

  useEffect(() => {
    if (prevMoveCountRef.current !== null && state.moveCount === 0 && prevMoveCountRef.current > 0) {
      setActiveHoleFills([]);
    }
    prevMoveCountRef.current = state.moveCount;
  }, [state.moveCount]);

  useEffect(() => {
    setActiveHoleFills([]);
  }, [state.levelIndex]);

  useEffect(() => {
    const prev = prevSnapshot.current;
    const sameLevel =
      prev !== null && prev.levelIndex === state.levelIndex && prev.level === state.level;
    if (sameLevel) {
      const fills = detectHoleFills(prev, state);
      if (fills.length > 0) {
        setActiveHoleFills((active) => [
          ...active,
          ...fills.map((f) => ({
            key: `hole-fill-${f.entityId}-${state.moveCount}`,
            entityId: f.entityId,
            entityKind: f.entityKind,
            from: f.from,
            hole: f.hole,
          })),
        ]);
      }
    }
    prevSnapshot.current = state;
  }, [state]);

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
      if (blockHoleFillInputRef.current) return;

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
            backgroundColor: "#4ade80",
            border: "1px solid #16a34a",
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
        margin: "0 auto",
        border: "1px solid #7c3aed",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#1e1b4b",
        boxShadow: "0 0 20px rgba(124, 58, 237, 0.3), inset 0 0 20px rgba(124, 58, 237, 0.1)",
      }}
    >
      {tileElements}
      {machineElements}
      {entityElements}
      {activeHoleFills.map((fill) => {
        const ghost: Entity = {
          id: fill.entityId,
          kind: fill.entityKind,
          position: fill.from,
        };
        return (
          <HoleFillOverlay
            key={fill.key}
            tileSize={TILE_SIZE}
            from={fill.from}
            hole={fill.hole}
            entityKind={fill.entityKind}
            entityFill={entityColor(ghost)}
            entityBorder={entityBorderColor(fill.entityKind)}
            holeColor={tileColor("hole")}
            floorColor={tileColor("floor")}
            onComplete={() => {
              removeHoleFill(fill.key);
            }}
          />
        );
      })}
      {playerElement}
    </div>
  );
}
