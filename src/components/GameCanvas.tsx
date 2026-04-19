import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
} from "react";
import { movePlayer } from "../store/actions";
import { useGame } from "../store/GameContext";
import type { Direction, Entity, Machine, TileType } from "../logic/types";
import { HoleFillOverlay } from "./HoleFillOverlay";
import { detectHoleFills } from "./holeFillDiff";

const TILE_SIZE = 48;

export const WALL_PAC_BORDER = "3px solid #0ff";

/** True when this wall side faces floor, hole, or goal (not another wall, not off-map). */
export function exposesWallPacEdge(neighbor: TileType | undefined): boolean {
  if (neighbor === "wall" || neighbor === undefined) return false;
  return neighbor === "floor" || neighbor === "hole" || neighbor === "goal";
}

export type WallPacBorderSides = Pick<
  CSSProperties,
  "borderTop" | "borderRight" | "borderBottom" | "borderLeft"
>;

export type WallPacCornerRadii = Pick<
  CSSProperties,
  | "borderTopLeftRadius"
  | "borderTopRightRadius"
  | "borderBottomRightRadius"
  | "borderBottomLeftRadius"
>;

export type WallPacTileOutlineStyle = WallPacBorderSides & WallPacCornerRadii;

/** Walls stay square; per-tile % rounding reads as blobs when runs share opposite edges (e.g. top+bottom). */
const WALL_CORNER_RADIUS = 0;

export function wallPacTileOutlineStyle(
  grid: (TileType | undefined)[][],
  x: number,
  y: number,
  width: number,
  height: number,
): WallPacTileOutlineStyle {
  const top = exposesWallPacEdge(y > 0 ? grid[y - 1]?.[x] : undefined);
  const right = exposesWallPacEdge(x < width - 1 ? grid[y]?.[x + 1] : undefined);
  const bottom = exposesWallPacEdge(y < height - 1 ? grid[y + 1]?.[x] : undefined);
  const left = exposesWallPacEdge(x > 0 ? grid[y]?.[x - 1] : undefined);
  const side = (exposed: boolean) => (exposed ? WALL_PAC_BORDER : "none");
  return {
    borderTop: side(top),
    borderRight: side(right),
    borderBottom: side(bottom),
    borderLeft: side(left),
    borderTopLeftRadius: WALL_CORNER_RADIUS,
    borderTopRightRadius: WALL_CORNER_RADIUS,
    borderBottomRightRadius: WALL_CORNER_RADIUS,
    borderBottomLeftRadius: WALL_CORNER_RADIUS,
  };
}

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
      return "#000000";
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

export function GameCanvas({
  onWin,
  hasNextLevel,
}: {
  onWin?: () => void;
  hasNextLevel: boolean;
}): ReactElement {
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
      if (!direction) {
        if (event.key === "Enter" && state.status === "won" && hasNextLevel) {
          event.preventDefault();
          onWin?.();
        }
        return;
      }

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
        const goalBorder = tile === "goal" ? "3px solid #f0f" : undefined;
        const holeBorder = tile === "hole" ? "3px solid #ef4444" : undefined;

        const tileStyle: React.CSSProperties = {
          position: "absolute",
          left: x * TILE_SIZE,
          top: y * TILE_SIZE,
          width: TILE_SIZE,
          height: TILE_SIZE,
          backgroundColor: tile === "wall" ? "#011" : tile === "goal" ? "#000" : tileColor(tile),
          boxSizing: "border-box",
        };

        if (tile === "wall") {
          Object.assign(tileStyle, wallPacTileOutlineStyle(tileGrid, x, y, width, height));
        } else {
          tileStyle.borderRadius = tile === "goal" || tile === "hole" ? "50%" : 0;
          if (goalBorder) {
            tileStyle.border = goalBorder;
          } else if (holeBorder) {
            tileStyle.border = holeBorder;
          }
        }

        elements.push(
          <div
            key={`tile-${x}-${y}`}
            style={tileStyle}
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
      const isRound = entity.kind === "box" || entity.kind === "debris";
      const tx = entity.position.x * TILE_SIZE;
      const ty = entity.position.y * TILE_SIZE;
      elements.push(
        <div
          key={`entity-${entity.id}`}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: TILE_SIZE,
            height: TILE_SIZE,
            // translate3d keeps border-radius during animation; left/top animation often squares the layer.
            transform: `translate3d(${tx}px, ${ty}px, 0)`,
            transition: "transform 0.1s ease",
            ...(isRound
              ? {
                  borderRadius: "50%",
                  overflow: "hidden",
                  backfaceVisibility: "hidden",
                }
              : {}),
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
              borderRadius: isRound ? "50%" : "0",
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
        border: "2px solid #000",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#000",
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
      {state.status === "won" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0, 0, 0, 0.6)",
            gap: "0.5rem",
          }}
        >
          <div
            style={{
              fontSize: "1.2rem",
              fontWeight: "bold",
              color: "#4ade80",
              textShadow: "0 0 12px rgba(74, 222, 128, 0.6)",
              letterSpacing: "2px",
            }}
          >
            {hasNextLevel ? "You Win!" : "Thanks For Playing!"}
          </div>
          <div
            style={{
              fontSize: "0.55rem",
              color: "#e2e8f0",
              opacity: 0.8,
            }}
          >
            {hasNextLevel ? "Press Enter" : "No More Levels"}
          </div>
        </div>
      )}
    </div>
  );
}
