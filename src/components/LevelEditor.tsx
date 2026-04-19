import { useState, useCallback, useRef, type ReactElement } from "react";
import type { TileType } from "../logic/types";

const TILE_SIZE = 32;

const TILE_SYMBOLS: Record<TileType, string> = {
  wall: "🟥",
  floor: "🟦",
  goal: "🟩",
  hole: "⬛",
  ice: "🧊",
};

const TILE_COLORS: Record<TileType, string> = {
  wall: "#4c1d95",
  floor: "#1e1b4b",
  goal: "#fbbf24",
  hole: "#000000",
  ice: "#22d3ee",
};

const TILE_LABELS: Record<TileType, string> = {
  wall: "Wall",
  floor: "Floor",
  goal: "Goal",
  hole: "Hole",
  ice: "Ice",
};

type EntityType = "box" | "debris";
type EntityTypeLabel = Record<EntityType, string>;
const ENTITY_LABELS: EntityTypeLabel = {
  box: "Box",
  debris: "Debris",
};

type MachineType = "fan" | "sprayer" | "freezer";
type MachineFacing = "up" | "down" | "left" | "right";
const MACHINE_FACING_LABELS: MachineFacing[] = ["up", "down", "left", "right"];

const ENTITY_KINDS: EntityType[] = ["box", "debris"];
const MACHINE_TYPES: MachineType[] = ["fan", "sprayer", "freezer"];

interface EditorLevel {
  width: number;
  height: number;
  tiles: TileType[][];
  playerStart: { x: number; y: number };
  entities: { kind: EntityType; position: { x: number; y: number } }[];
  machines: {
    type: MachineType;
    position: { x: number; y: number };
    facing: MachineFacing;
  }[];
}

function createEmptyTiles(width: number, height: number): TileType[][] {
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => "floor" as TileType),
  );
}

export function LevelEditor({
  onExport,
  onCancel,
}: {
  onExport: (json: string) => void;
  onCancel: () => void;
}): ReactElement {
  const [width, setWidth] = useState(10);
  const [height, setHeight] = useState(8);
  const [tiles, setTiles] = useState<TileType[][]>(() => createEmptyTiles(10, 8));
  const [playerStart, setPlayerStart] = useState({ x: 0, y: 0 });
  const [entities, setEntities] = useState<
    { kind: EntityType; position: { x: number; y: number } }[]
  >([]);
  const [machines, setMachines] = useState<
    {
      type: MachineType;
      position: { x: number; y: number };
      facing: MachineFacing;
    }[]
  >([]);
  const [selectedMode, setSelectedMode] = useState<
    "tile" | "player" | "entity" | "machine"
  >("tile");
  const [selectedTile, setSelectedTile] = useState<TileType>("wall");
  const [selectedEntity, setSelectedEntity] = useState<EntityType>("box");
  const [selectedMachine, setSelectedMachine] = useState<MachineType>("fan");
  const [machineFacing, setMachineFacing] = useState<MachineFacing>("right");
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const gridRef = useRef<HTMLDivElement>(null);

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      if (selectedMode === "tile") {
        setTiles((prev) => {
          const next = prev.map((row) => [...row]);
          next[y][x] = selectedTile;
          return next;
        });
      } else if (selectedMode === "player") {
        setPlayerStart({ x, y });
      } else if (selectedMode === "entity") {
        setEntities((prev) => {
          const existing = prev.findIndex(
            (e) => e.position.x === x && e.position.y === y,
          );
          const next = [...prev];
          if (existing >= 0) {
            next[existing] = { kind: selectedEntity, position: { x, y } };
          } else {
            next.push({ kind: selectedEntity, position: { x, y } });
          }
          return next;
        });
      } else if (selectedMode === "machine") {
        setMachines((prev) => {
          const existing = prev.findIndex(
            (m) => m.position.x === x && m.position.y === y,
          );
          const next = [...prev];
          if (existing >= 0) {
            next[existing] = {
              type: selectedMachine,
              position: { x, y },
              facing: machineFacing,
            };
          } else {
            next.push({
              type: selectedMachine,
              position: { x, y },
              facing: machineFacing,
            });
          }
          return next;
        });
      }
    },
    [selectedMode, selectedTile, selectedEntity, selectedMachine, machineFacing, width, height],
  );

  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      if (e.button === 2 && selectedMode === "tile") {
        e.preventDefault();
        setTiles((prev) => {
          const next = prev.map((row) => [...row]);
          next[y][x] = "floor";
          return next;
        });
      }
    },
    [selectedMode, width, height],
  );

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      if (x >= 0 && x < width && y >= 0 && y < height) {
        setHoverCell({ x, y });
      } else {
        setHoverCell(null);
      }
    },
    [width, height],
  );

  const handleGridDrag = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const rect = gridRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.floor((e.clientX - rect.left) / TILE_SIZE);
      const y = Math.floor((e.clientY - rect.top) / TILE_SIZE);
      if (x < 0 || x >= width || y < 0 || y >= height) return;

      if (selectedMode === "tile") {
        setTiles((prev) => {
          const next = prev.map((row) => [...row]);
          next[y][x] = selectedTile;
          return next;
        });
      } else if (selectedMode === "player") {
        setPlayerStart({ x, y });
      } else if (selectedMode === "entity") {
        setEntities((prev) => {
          const existing = prev.findIndex(
            (en) => en.position.x === x && en.position.y === y,
          );
          const next = [...prev];
          if (existing >= 0) {
            next[existing] = { kind: selectedEntity, position: { x, y } };
          } else {
            next.push({ kind: selectedEntity, position: { x, y } });
          }
          return next;
        });
      } else if (selectedMode === "machine") {
        setMachines((prev) => {
          const existing = prev.findIndex(
            (m) => m.position.x === x && m.position.y === y,
          );
          const next = [...prev];
          if (existing >= 0) {
            next[existing] = {
              type: selectedMachine,
              position: { x, y },
              facing: machineFacing,
            };
          } else {
            next.push({
              type: selectedMachine,
              position: { x, y },
              facing: machineFacing,
            });
          }
          return next;
        });
      }
    },
    [isDragging, selectedMode, selectedTile, selectedEntity, selectedMachine, machineFacing, width, height],
  );

  const handleClear = useCallback(() => {
    setTiles(createEmptyTiles(width, height));
    setPlayerStart({ x: 0, y: 0 });
    setEntities([]);
    setMachines([]);
  }, [width, height]);

  const handleExport = useCallback(() => {
    const json = JSON.stringify(
      { width, height, tiles, playerStart, entities, machines },
      null,
      2,
    );
    onExport(json);
  }, [width, height, tiles, playerStart, entities, machines, onExport]);

  const handleImport = useCallback(() => {
    const json = prompt("Paste level JSON:");
    if (!json) return;
    try {
      const data = JSON.parse(json);
      if (
        typeof data.width === "number" &&
        typeof data.height === "number" &&
        Array.isArray(data.tiles) &&
        data.playerStart &&
        Array.isArray(data.entities) &&
        Array.isArray(data.machines)
      ) {
        setWidth(data.width);
        setHeight(data.height);
        setTiles(data.tiles);
        setPlayerStart(data.playerStart);
        setEntities(data.entities);
        setMachines(data.machines);
      }
    } catch {
      alert("Invalid JSON");
    }
  }, []);

  return (
    <div
      style={{
        padding: "1rem",
        maxWidth: "1000px",
        margin: "0 auto",
        fontFamily: "'Press Start 2P', 'Courier New', monospace",
        color: "#e2e8f0",
        background:
          "linear-gradient(180deg, rgba(168, 85, 240, 0.12) 0%, rgba(10, 10, 26, 0) 40%)," +
          "linear-gradient(180deg, #0a0a1a 0%, #111128 100%)",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          marginBottom: "1rem",
          fontSize: "1.2rem",
          textAlign: "center",
          background: "linear-gradient(180deg, #f0f 0%, #a855f7 50%, #06b6d4 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          filter: "drop-shadow(0 0 8px rgba(168, 85, 240, 0.6))",
          letterSpacing: "2px",
        }}
      >
        LEVEL EDITOR
      </h1>

      {/* Grid size + tools */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          marginBottom: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "0.7rem",
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          W:
          <input
            type="number"
            min={3}
            max={30}
            value={width}
            onChange={(e) => {
              const w = Math.min(30, Math.max(3, parseInt(e.target.value || "3", 10)));
              setWidth(w);
              setTiles((prev) => {
                const next = createEmptyTiles(w, height);
                for (let y = 0; y < Math.min(prev.length, height); y++) {
                  for (let x = 0; x < Math.min(prev[y]?.length || 0, w); x++) {
                    next[y][x] = prev[y][x];
                  }
                }
                return next;
              });
            }}
            style={{
              width: "40px",
              background: "#1f2937",
              border: "1px solid #7c3aed",
              color: "#e2e8f0",
              padding: "0.2rem",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          />
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
          H:
          <input
            type="number"
            min={3}
            max={30}
            value={height}
            onChange={(e) => {
              const h = Math.min(30, Math.max(3, parseInt(e.target.value || "3", 10)));
              setHeight(h);
              setTiles((prev) => {
                const next = createEmptyTiles(width, h);
                for (let y = 0; y < Math.min(prev.length, h); y++) {
                  for (let x = 0; x < Math.min(prev[y]?.length || 0, width); x++) {
                    next[y][x] = prev[y][x];
                  }
                }
                return next;
              });
            }}
            style={{
              width: "40px",
              background: "#1f2937",
              border: "1px solid #7c3aed",
              color: "#e2e8f0",
              padding: "0.2rem",
              borderRadius: "4px",
              fontFamily: "inherit",
              fontSize: "inherit",
            }}
          />
        </label>

        <div style={{ width: "1px", height: "20px", background: "#7c3aed", margin: "0 0.5rem" }} />

        {/* Mode buttons */}
        {(["", "tile", "player", "entity", "machine"] as const).map(
          (mode) => {
            const labels: Record<string, string> = {
              "": "Select",
              tile: "Tile",
              player: "Player",
              entity: "Entity",
              machine: "Machine",
            };
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setSelectedMode(mode)}
                style={{
                  background:
                    selectedMode === mode
                      ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
                  color: selectedMode === mode ? "#fff" : "#e2e8f0",
                  border: "1px solid #7c3aed",
                  borderRadius: "4px",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                  boxShadow:
                    selectedMode === mode
                      ? "0 0 8px rgba(124, 58, 237, 0.5)"
                      : "none",
                }}
              >
                {labels[mode]}
              </button>
            );
          },
        )}

        {/* Tile type selector */}
        {selectedMode === "tile" && (
          <>
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "#7c3aed",
                margin: "0 0.5rem",
              }}
            />
            {(Object.keys(TILE_SYMBOLS) as TileType[]).map((tile) => (
              <button
                key={tile}
                type="button"
                onClick={() => setSelectedTile(tile)}
                style={{
                  background:
                    selectedTile === tile
                      ? TILE_COLORS[tile]
                      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
                  color: selectedTile === tile ? "#fff" : "#e2e8f0",
                  border: `1px solid ${selectedTile === tile ? "#a855f7" : "#7c3aed"}`,
                  borderRadius: "4px",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                  boxShadow:
                    selectedTile === tile
                      ? `0 0 8px ${TILE_COLORS[tile]}`
                      : "none",
                }}
              >
                {TILE_SYMBOLS[tile]} {TILE_LABELS[tile]}
              </button>
            ))}
          </>
        )}

        {/* Entity type selector */}
        {selectedMode === "entity" && (
          <>
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "#7c3aed",
                margin: "0 0.5rem",
              }}
            />
            {ENTITY_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                onClick={() => setSelectedEntity(kind)}
                style={{
                  background:
                    selectedEntity === kind
                      ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
                  color: selectedEntity === kind ? "#fff" : "#e2e8f0",
                  border: "1px solid #7c3aed",
                  borderRadius: "4px",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                }}
              >
                {ENTITY_LABELS[kind]}
              </button>
            ))}
          </>
        )}

        {/* Machine type + facing selector */}
        {selectedMode === "machine" && (
          <>
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "#7c3aed",
                margin: "0 0.5rem",
              }}
            />
            {MACHINE_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMachine(type)}
                style={{
                  background:
                    selectedMachine === type
                      ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
                  color: selectedMachine === type ? "#fff" : "#e2e8f0",
                  border: "1px solid #7c3aed",
                  borderRadius: "4px",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                }}
              >
                {type}
              </button>
            ))}
            <div
              style={{
                width: "1px",
                height: "20px",
                background: "#7c3aed",
                margin: "0 0.5rem",
              }}
            />
            {MACHINE_FACING_LABELS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setMachineFacing(f)}
                style={{
                  background:
                    machineFacing === f
                      ? "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)"
                      : "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
                  color: machineFacing === f ? "#fff" : "#e2e8f0",
                  border: "1px solid #7c3aed",
                  borderRadius: "4px",
                  padding: "0.3rem 0.5rem",
                  fontFamily: "inherit",
                  fontSize: "inherit",
                  cursor: "pointer",
                }}
              >
                {f}
              </button>
            ))}
          </>
        )}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#e2e8f0",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.3rem 0.5rem",
            fontFamily: "inherit",
            fontSize: "inherit",
            cursor: "pointer",
          }}
        >
          Clear
        </button>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        onMouseDown={(e) => {
          if (e.button === 0) setIsDragging(true);
          handleGridClick(e);
        }}
        onMouseOut={() => {
          setIsDragging(false);
          setHoverCell(null);
        }}
        onMouseMove={(e) => {
          handleGridMouseMove(e);
          if (isDragging && e.buttons === 1) handleGridDrag(e);
        }}
        onMouseUp={() => setIsDragging(false)}
        style={{
          display: "inline-grid",
          gridTemplateColumns: `repeat(${width}, ${TILE_SIZE}px)`,
          gridTemplateRows: `repeat(${height}, ${TILE_SIZE}px)`,
          gap: "1px",
          background: "#1f2937",
          border: "1px solid #7c3aed",
          borderRadius: "8px",
          padding: "1px",
          userSelect: "none",
          marginBottom: "1rem",
        }}
      >
        {tiles.flatMap((row, y) =>
          row.map((tile, x) => {
            const isPlayer = playerStart.x === x && playerStart.y === y;
            const entity = entities.find(
              (e) => e.position.x === x && e.position.y === y,
            );
            const machine = machines.find(
              (m) => m.position.x === x && m.position.y === y,
            );
            const isHover = hoverCell?.x === x && hoverCell?.y === y;

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  backgroundColor: TILE_COLORS[tile],
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.5rem",
                  position: "relative",
                  border: isHover ? "1px solid #a855f7" : "none",
                }}
              >
                {isPlayer && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      width: TILE_SIZE - 8,
                      height: TILE_SIZE - 8,
                      backgroundColor: "#4ade80",
                      border: "1px solid #16a34a",
                      borderRadius: "2px",
                    }}
                  />
                )}
                {entity && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      width: TILE_SIZE - 8,
                      height: TILE_SIZE - 8,
                      backgroundColor:
                        entity.kind === "box" ? "#f97316" : "#a78bfa",
                      border: "1px solid #7c3aed",
                      borderRadius: "2px",
                    }}
                  />
                )}
                {machine && (
                  <div
                    style={{
                      position: "absolute",
                      top: 2,
                      left: 2,
                      width: TILE_SIZE - 4,
                      height: TILE_SIZE - 4,
                      backgroundColor:
                        machine.type === "fan"
                          ? "#fb923c"
                          : machine.type === "sprayer"
                            ? "#22d3ee"
                            : "#818cf8",
                      border: "1px solid #7c3aed",
                      borderRadius: "2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.7rem",
                    }}
                  >
                    {machine.facing === "up"
                      ? "↑"
                      : machine.facing === "down"
                        ? "↓"
                        : machine.facing === "left"
                          ? "←"
                          : "→"}
                  </div>
                )}
              </div>
            );
          }),
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={handleExport}
          style={{
            background:
              "linear-gradient(180deg, #a855f7 0%, #7c3aed 100%)",
            color: "#fff",
            border: "1px solid #a855f7",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            cursor: "pointer",
            boxShadow: "0 0 12px rgba(168, 85, 240, 0.5)",
          }}
        >
          Export JSON
        </button>
        <button
          type="button"
          onClick={handleImport}
          style={{
            background:
              "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#c084fc",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            cursor: "pointer",
            boxShadow: "0 0 8px rgba(124, 58, 237, 0.3)",
          }}
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background:
              "linear-gradient(180deg, #1f2937 0%, #111827 100%)",
            color: "#e2e8f0",
            border: "1px solid #7c3aed",
            borderRadius: "4px",
            padding: "0.5rem 1rem",
            fontFamily: "inherit",
            fontSize: "0.75rem",
            cursor: "pointer",
            boxShadow: "0 0 8px rgba(124, 58, 237, 0.3)",
          }}
        >
          Back to Game
        </button>
      </div>

      {/* Export textarea */}
      <ExportOutput />
    </div>
  );
}

function ExportOutput(): ReactElement {
  const [copied, setCopied] = useState(false);

  return null;
}
