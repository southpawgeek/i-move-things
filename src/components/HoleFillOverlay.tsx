import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import type { Entity, Position } from "../logic/types";

const SLIDE_MS = 150;
const SHRINK_MS = 140;
const HOLE_FILL_MS = 180;

function colorsMatch(a: string, b: string): boolean {
  return a.replace(/\s/g, "").toLowerCase() === b.replace(/\s/g, "").toLowerCase();
}

type HoleFillOverlayProps = {
  tileSize: number;
  from: Position;
  hole: Position;
  entityKind: Entity["kind"];
  entityFill: string;
  entityBorder: string;
  holeColor: string;
  floorColor: string;
  onComplete: () => void;
};

export function HoleFillOverlay({
  tileSize,
  from,
  hole,
  entityKind,
  entityFill,
  entityBorder,
  holeColor,
  floorColor,
  onComplete,
}: HoleFillOverlayProps): ReactElement {
  const [phase, setPhase] = useState<"slide" | "shrink" | "fill" | "done">("slide");
  const slideCommitted = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const finishedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setPhase("done");
    onCompleteRef.current();
  }, []);

  const isPuddle = entityKind === "puddle";
  const isRound = entityKind === "box" || entityKind === "debris";
  const innerTop = isPuddle ? 8 : 4;
  const innerLeft = isPuddle ? 8 : 4;
  const innerW = isPuddle ? tileSize - 16 : tileSize - 8;
  const innerH = isPuddle ? tileSize - 16 : tileSize - 8;

  const fromPx = useMemo(
    () => ({ x: from.x * tileSize, y: from.y * tileSize }),
    [from.x, from.y, tileSize],
  );
  const holePx = useMemo(
    () => ({ x: hole.x * tileSize, y: hole.y * tileSize }),
    [hole.x, hole.y, tileSize],
  );

  const [slidePos, setSlidePos] = useState(fromPx);

  // Controlled translate3d so React never snaps back to `from` after shrink/fill; GPU path keeps circles round.
  useLayoutEffect(() => {
    if (phase === "slide") {
      setSlidePos(fromPx);
      const id = requestAnimationFrame(() => {
        setSlidePos(holePx);
      });
      return () => cancelAnimationFrame(id);
    }
    setSlidePos(holePx);
  }, [fromPx, holePx, phase]);

  // No movement: skip slide (no transitionend when left/top don't change).
  useLayoutEffect(() => {
    if (phase !== "slide") return;
    if (from.x === hole.x && from.y === hole.y) {
      slideCommitted.current = true;
      setPhase("shrink");
    }
  }, [phase, from.x, from.y, hole.x, hole.y]);

  // Hole and floor are often the same hex — no background-color transition, so transitionend never fires.
  useLayoutEffect(() => {
    if (phase !== "fill") return;
    if (colorsMatch(holeColor, floorColor)) {
      finish();
    }
  }, [phase, holeColor, floorColor, finish]);

  // Per-phase backups (do not depend on `onComplete` identity — avoids timer reset loops).
  useEffect(() => {
    if (phase !== "slide") return;
    const id = window.setTimeout(() => {
      if (!slideCommitted.current) {
        slideCommitted.current = true;
        setPhase("shrink");
      }
    }, SLIDE_MS + 50);
    return () => window.clearTimeout(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "shrink") return;
    const id = window.setTimeout(() => {
      setPhase((p) => (p === "shrink" ? "fill" : p));
    }, SHRINK_MS + 50);
    return () => window.clearTimeout(id);
  }, [phase]);

  // When colors differ, still guard against missing transitionend (reduced motion, browser quirks).
  useEffect(() => {
    if (phase !== "fill") return;
    if (colorsMatch(holeColor, floorColor)) return;
    const id = window.setTimeout(() => finish(), HOLE_FILL_MS + 80);
    return () => window.clearTimeout(id);
  }, [phase, holeColor, floorColor, finish]);

  function onWrapperTransitionEnd(event: React.TransitionEvent<HTMLDivElement>): void {
    if (event.target !== wrapperRef.current) return;
    if (event.propertyName !== "transform") return;
    if (slideCommitted.current) return;
    slideCommitted.current = true;
    setPhase("shrink");
  }

  function onInnerTransitionEnd(event: React.TransitionEvent<HTMLDivElement>): void {
    if (event.propertyName !== "transform") return;
    setPhase("fill");
  }

  function onMaskTransitionEnd(event: React.TransitionEvent<HTMLDivElement>): void {
    if (event.target !== event.currentTarget) return;
    if (event.propertyName !== "background-color") return;
    finish();
  }

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: hole.x * tileSize,
          top: hole.y * tileSize,
          width: tileSize,
          height: tileSize,
          zIndex: 4,
          pointerEvents: "none",
          boxSizing: "border-box",
          backgroundColor: phase === "fill" || phase === "done" ? floorColor : holeColor,
          transition:
            phase === "fill" || phase === "done"
              ? `background-color ${HOLE_FILL_MS}ms ease`
              : undefined,
        }}
        onTransitionEnd={phase === "fill" && !colorsMatch(holeColor, floorColor) ? onMaskTransitionEnd : undefined}
      />
      {phase !== "done" ? (
        <div
          ref={wrapperRef}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: tileSize,
            height: tileSize,
            transform: `translate3d(${slidePos.x}px, ${slidePos.y}px, 0)`,
            zIndex: 5,
            pointerEvents: "none",
            transition:
              phase === "slide" ? `transform ${SLIDE_MS}ms ease` : undefined,
            ...(isRound
              ? {
                  borderRadius: "50%",
                  overflow: "hidden",
                  backfaceVisibility: "hidden",
                }
              : {}),
          }}
          onTransitionEnd={phase === "slide" ? onWrapperTransitionEnd : undefined}
        >
          <div
            style={{
              position: "absolute",
              top: innerTop,
              left: innerLeft,
              width: innerW,
              height: innerH,
              backgroundColor: entityFill,
              border: `1px solid ${entityBorder}`,
              boxSizing: "border-box",
              borderRadius: isRound ? "50%" : "0",
              transform: phase === "slide" ? "scale(1)" : "scale(0)",
              transformOrigin: "center center",
              transition: phase === "shrink" ? `transform ${SHRINK_MS}ms ease` : undefined,
            }}
            onTransitionEnd={phase === "shrink" ? onInnerTransitionEnd : undefined}
          />
        </div>
      ) : null}
    </>
  );
}
