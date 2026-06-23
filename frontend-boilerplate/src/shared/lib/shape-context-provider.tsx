"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import {
  ShapeContext,
  shapeMap,
  shapeOrder,
  transitionShape,
  type ShapeVariant,
} from "@/shared/lib/shape-context-internal";

export function ShapeProvider({
  children,
  defaultShape = "pill",
}: {
  children: ReactNode;
  defaultShape?: ShapeVariant;
}) {
  const [shape, setShapeState] = useState<ShapeVariant>(defaultShape);

  const setShape = useCallback((next: ShapeVariant) => {
    transitionShape(() => setShapeState(next));
  }, []);

  // Global keyboard shortcut: R to cycle radius
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "r" && e.key !== "R") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;
      e.preventDefault();
      transitionShape(() => {
        setShapeState((prev) => {
          const idx = shapeOrder.indexOf(prev);
          return shapeOrder[(idx + 1) % shapeOrder.length];
        });
      });
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <ShapeContext.Provider value={{ shape, setShape, classes: shapeMap[shape] }}>
      {children}
    </ShapeContext.Provider>
  );
}
