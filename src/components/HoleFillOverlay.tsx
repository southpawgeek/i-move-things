import { useLayoutEffect, useRef, useState, type ReactElement } from "react";
import type { Entity, Position } from "../logic/types";

const SLIDE_MS = 150;
const SHRINK_MS = 140;
const HOLE_FILL_MS = 180;

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
  const maskFilled = useRef(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const doneRef = useRef(false);

  const isPuddle = entityKind === "puddle";
  const innerTop = isPuddle ? 8 : 4;
  const innerLeft = isPuddle ? 8 : 4;
  const innerW = isPuddle ? tileSize - 16 : tileSize - 8;
  const innerH = isPuddle ? tileSize - 16 : tileSize - 8;

  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    el.style.left = `${from.x * tileSize}px`;
    el.style.top = `${from.y * tileSize}px`;
    void el.offsetHeight;
    requestAnimationFrame(() => {
      el.style.left = `${hole.x * tileSize}px`;
      el.style.top = `${hole.y * tileSize}px`;
    });
  }, [from.x, from.y, hole.x, hole.y, tileSize]);

  function onWrapperTransitionEnd(event: React.TransitionEvent<HTMLDivElement>): void {
    if (event.target !== wrapperRef.current) return;
    if (event.propertyName !== "left" && event.propertyName !== "top") return;
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
    if (maskFilled.current) return;
    maskFilled.current = true;
    setPhase("done");
    onComplete();
  }

  // Fallback timeout in case transition events don't fire
  const totalMs = SLIDE_MS + SHRINK_MS + HOLE_FILL_MS + 100;
  useLayoutEffect(() => {
    if (phase === "done") return;
    const timer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        setPhase("done");
        onComplete();
      }
    }, totalMs);
    return () => clearTimeout(timer);
  }, [phase, onComplete]);

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
        onTransitionEnd={phase === "fill" ? onMaskTransitionEnd : undefined}
      />
      {phase !== "done" ? (
        <div
          ref={wrapperRef}
          style={{
            position: "absolute",
            left: from.x * tileSize,
            top: from.y * tileSize,
            width: tileSize,
            height: tileSize,
            zIndex: 5,
            pointerEvents: "none",
            transition:
              phase === "slide" ? `left ${SLIDE_MS}ms ease, top ${SLIDE_MS}ms ease` : undefined,
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
