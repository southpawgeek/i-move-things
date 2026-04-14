import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef, type ReactElement } from "react";
import { movePlayer } from "../store/actions";
import { useGame } from "../store/GameContext";
import type { Direction, Entity, GameState, Machine, TileType } from "../logic/types";

const TILE_SIZE = 48;

type MachineGraphics = {
  root: Container;
  base: Graphics;
  arrow: Graphics;
};

function tileColor(tile: TileType): number {
  switch (tile) {
    case "wall":
      return 0x334155;
    case "goal":
      return 0xf59e0b;
    case "ice":
      return 0x93c5fd;
    case "floor":
    default:
      return 0x0f172a;
  }
}

function entityColor(entity: Entity): number {
  switch (entity.kind) {
    case "box":
      return 0x92400e;
    case "debris":
      return 0x6b7280;
    case "puddle":
      return 0x38bdf8;
    default:
      return 0xffffff;
  }
}

function machineColor(type: Machine["type"]): number {
  switch (type) {
    case "sprayer":
      return 0x14b8a6;
    case "freezer":
      return 0x3b82f6;
    case "fan":
    default:
      return 0xfb923c;
  }
}

function drawTile(graphics: Graphics, tile: TileType): void {
  graphics.clear().rect(0, 0, TILE_SIZE, TILE_SIZE).fill(tileColor(tile));
  graphics.rect(0, 0, TILE_SIZE, TILE_SIZE).stroke({ width: 1, color: 0x1f2937 });
}

function drawEntity(graphics: Graphics, entity: Entity): void {
  graphics.clear();
  if (entity.kind === "puddle") {
    graphics
      .rect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16)
      .fill(entityColor(entity))
      .rect(8, 8, TILE_SIZE - 16, TILE_SIZE - 16)
      .stroke({ width: 1, color: 0x0c4a6e });
    return;
  }

  graphics
    .rect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8)
    .fill(entityColor(entity))
    .rect(4, 4, TILE_SIZE - 8, TILE_SIZE - 8)
    .stroke({ width: 1, color: 0x111827 });
}

function machineArrowPoints(facing: Machine["facing"]): number[] {
  const min = 10;
  const max = TILE_SIZE - 10;
  const mid = TILE_SIZE / 2;

  switch (facing) {
    case "up":
      return [mid, min, max, max, min, max];
    case "down":
      return [min, min, max, min, mid, max];
    case "left":
      return [min, mid, max, min, max, max];
    case "right":
    default:
      return [min, min, max, mid, min, max];
  }
}

function drawMachine(machineGraphics: MachineGraphics, machine: Machine): void {
  machineGraphics.base
    .clear()
    .rect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4)
    .fill(machineColor(machine.type))
    .rect(2, 2, TILE_SIZE - 4, TILE_SIZE - 4)
    .stroke({ width: 1, color: 0x111827 });

  machineGraphics.arrow
    .clear()
    .poly(machineArrowPoints(machine.facing))
    .fill(0x111827);
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
  const latestStateRef = useRef<GameState>(state);

  useEffect(() => {
    latestStateRef.current = state;
  }, [state]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const app = new Application();
    let cancelled = false;
    let initialized = false;

    const tileLayer = new Container();
    const machineLayer = new Container();
    const entityLayer = new Container();
    const playerLayer = new Container();

    const tileGraphics = new Map<string, Graphics>();
    const tileKinds = new Map<string, TileType>();
    const machineGraphics = new Map<string, MachineGraphics>();
    const entityGraphics = new Map<string, Graphics>();

    const playerGraphic = new Graphics()
      .rect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12)
      .fill(0x22c55e)
      .rect(6, 6, TILE_SIZE - 12, TILE_SIZE - 12)
      .stroke({ width: 1, color: 0x052e16 });
    playerLayer.addChild(playerGraphic);

    function syncTiles(current: GameState): void {
      for (let y = 0; y < current.level.height; y += 1) {
        for (let x = 0; x < current.level.width; x += 1) {
          const key = `${x},${y}`;
          const tile = current.tiles[y]?.[x];
          if (!tile) continue;

          let graphic = tileGraphics.get(key);
          if (!graphic) {
            graphic = new Graphics();
            graphic.x = x * TILE_SIZE;
            graphic.y = y * TILE_SIZE;
            tileLayer.addChild(graphic);
            tileGraphics.set(key, graphic);
          }

          if (tileKinds.get(key) !== tile) {
            drawTile(graphic, tile);
            tileKinds.set(key, tile);
          }
        }
      }
    }

    function syncMachines(current: GameState): void {
      const activeIds = new Set(current.machines.map((machine) => machine.id));

      for (const [id, graphics] of machineGraphics) {
        if (!activeIds.has(id)) {
          machineLayer.removeChild(graphics.root);
          graphics.root.destroy({ children: true });
          machineGraphics.delete(id);
        }
      }

      for (const machine of current.machines) {
        let graphics = machineGraphics.get(machine.id);
        if (!graphics) {
          const root = new Container();
          const base = new Graphics();
          const arrow = new Graphics();
          root.addChild(base);
          root.addChild(arrow);
          machineLayer.addChild(root);
          graphics = { root, base, arrow };
          machineGraphics.set(machine.id, graphics);
        }

        drawMachine(graphics, machine);
        graphics.root.x = machine.position.x * TILE_SIZE;
        graphics.root.y = machine.position.y * TILE_SIZE;
      }
    }

    function syncEntities(current: GameState): void {
      const activeIds = new Set(current.entities.map((entity) => entity.id));

      for (const [id, graphic] of entityGraphics) {
        if (!activeIds.has(id)) {
          entityLayer.removeChild(graphic);
          graphic.destroy();
          entityGraphics.delete(id);
        }
      }

      for (const entity of current.entities) {
        let graphic = entityGraphics.get(entity.id);
        if (!graphic) {
          graphic = new Graphics();
          entityLayer.addChild(graphic);
          entityGraphics.set(entity.id, graphic);
        }

        drawEntity(graphic, entity);
        graphic.x = entity.position.x * TILE_SIZE;
        graphic.y = entity.position.y * TILE_SIZE;
      }
    }

    function syncPlayer(current: GameState): void {
      playerGraphic.x = current.playerPosition.x * TILE_SIZE;
      playerGraphic.y = current.playerPosition.y * TILE_SIZE;
    }

    void app
      .init({
        backgroundColor: 0x020617,
        width: state.level.width * TILE_SIZE,
        height: state.level.height * TILE_SIZE,
        antialias: true,
        preference: "webgl",
      })
      .then(() => {
        initialized = true;
        if (cancelled) {
          app.destroy(true, true);
          return;
        }

        host.appendChild(app.canvas);
        app.stage.addChild(tileLayer);
        app.stage.addChild(machineLayer);
        app.stage.addChild(entityLayer);
        app.stage.addChild(playerLayer);

        // Draw once immediately so the grid is visible before first ticker callback.
        const current = latestStateRef.current;
        syncTiles(current);
        syncMachines(current);
        syncEntities(current);
        syncPlayer(current);

        app.ticker.add(() => {
          const latest = latestStateRef.current;
          syncTiles(latest);
          syncMachines(latest);
          syncEntities(latest);
          syncPlayer(latest);
        });
      })
      .catch((error: unknown) => {
        // Keep app resilient in dev if WebGL init fails or StrictMode double-invokes.
        // eslint-disable-next-line no-console
        console.error("Failed to initialize Pixi Application", error);
      });

    return () => {
      cancelled = true;
      if (initialized) {
        app.destroy(true, true);
      }
    };
  }, [dispatch, state.level.height, state.level.width]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      const direction = keyToDirection(event.key);
      if (!direction) return;

      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
      }
      if (event.repeat) return;
      if (latestStateRef.current.status === "won") return;

      dispatch(movePlayer(direction));
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dispatch]);

  return (
    <div
      ref={hostRef}
      style={{
        width: "100%",
        minHeight: "360px",
        display: "grid",
        placeItems: "center",
        border: "1px solid #1f2937",
        borderRadius: "8px",
        overflow: "hidden",
        background: "#020617",
      }}
    />
  );
}
