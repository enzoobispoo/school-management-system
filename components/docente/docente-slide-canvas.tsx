"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  SlideDeckElement,
  SlideDeckSlideV1,
} from "@/lib/docente/slide-deck";
import { cn } from "@/lib/utils";

type Props = {
  slide: SlideDeckSlideV1;
  bulletLines: string[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElements: (next: SlideDeckElement[]) => void;
};

function clampPct(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n));
}

export function DocenteSlideCanvas(props: Props) {
  const {
    slide,
    bulletLines,
    selectedElementId,
    onSelectElement,
    onUpdateElements,
  } = props;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const slideRef = useRef(slide);
  useEffect(() => {
    slideRef.current = slide;
  }, [slide]);

  const dragRef = useRef<{
    id: string;
    ox: number;
    oy: number;
    ow: number;
    oh: number;
    px: number;
    py: number;
  } | null>(null);

  const resizeRef = useRef<{
    id: string;
    ow: number;
    oh: number;
    ox: number;
    oy: number;
    px: number;
    py: number;
  } | null>(null);

  const elements = slide.elements ?? [];
  const useFreeform = elements.length > 0;
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [resizingId, setResizingId] = useState<string | null>(null);

  const patchElements = useCallback(
    (fn: (els: SlideDeckElement[]) => SlideDeckElement[]) => {
      onUpdateElements(fn(slideRef.current.elements ?? []));
    },
    [onUpdateElements]
  );

  const moveElements = useCallback(
    (id: string, nx: number, ny: number) => {
      patchElements((els) => {
        const cur = els.find((e) => e.id === id);
        if (!cur) return els;
        const x = clampPct(nx, 0, 100 - cur.w);
        const y = clampPct(ny, 0, 100 - cur.h);
        return els.map((e) => (e.id === id ? { ...e, x, y } : e));
      });
    },
    [patchElements]
  );

  const resizeElement = useCallback(
    (id: string, nw: number, nh: number) => {
      patchElements((els) => {
        const cur = els.find((e) => e.id === id);
        if (!cur) return els;
        const w = clampPct(nw, 4, 100 - cur.x);
        const h = clampPct(nh, 3, 100 - cur.y);
        return els.map((e) => (e.id === id ? { ...e, w, h } : e));
      });
    },
    [patchElements]
  );

  const startDrag = useCallback(
    (el: SlideDeckElement, ev: React.PointerEvent) => {
      if (!rootRef.current) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragRef.current = {
        id: el.id,
        ox: el.x,
        oy: el.y,
        ow: el.w,
        oh: el.h,
        px: ev.clientX,
        py: ev.clientY,
      };
      setDraggingId(el.id);
      onSelectElement(el.id);

      function onMove(e: PointerEvent) {
        const d = dragRef.current;
        const root = rootRef.current;
        if (!d || !root) return;
        const rect = root.getBoundingClientRect();
        const dx = ((e.clientX - d.px) / rect.width) * 100;
        const dy = ((e.clientY - d.py) / rect.height) * 100;
        moveElements(d.id, d.ox + dx, d.oy + dy);
      }

      function onUp(e: PointerEvent) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        dragRef.current = null;
        setDraggingId(null);
        try {
          (ev.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    },
    [moveElements, onSelectElement]
  );

  const startResize = useCallback(
    (el: SlideDeckElement, ev: React.PointerEvent) => {
      if (!rootRef.current) return;
      ev.preventDefault();
      ev.stopPropagation();
      resizeRef.current = {
        id: el.id,
        ow: el.w,
        oh: el.h,
        ox: el.x,
        oy: el.y,
        px: ev.clientX,
        py: ev.clientY,
      };
      setResizingId(el.id);

      function onMove(e: PointerEvent) {
        const d = resizeRef.current;
        const root = rootRef.current;
        if (!d || !root) return;
        const rect = root.getBoundingClientRect();
        const dw = ((e.clientX - d.px) / rect.width) * 100;
        const dh = ((e.clientY - d.py) / rect.height) * 100;
        resizeElement(d.id, d.ow + dw, d.oh + dh);
      }

      function onUp(e: PointerEvent) {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        resizeRef.current = null;
        setResizingId(null);
        try {
          (ev.target as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
      }

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      (ev.target as HTMLElement).setPointerCapture(ev.pointerId);
    },
    [resizeElement]
  );

  /** Evita arrastar quando o utilizador está a interagir com redimensionar. */
  useEffect(() => {
    return () => {
      dragRef.current = null;
      resizeRef.current = null;
    };
  }, []);

  const bgStyle: React.CSSProperties = {};
  if (slide.backgroundImageUrl?.trim()) {
    bgStyle.backgroundImage = `url(${slide.backgroundImageUrl.trim()})`;
    bgStyle.backgroundSize = "cover";
    bgStyle.backgroundPosition = "center";
  }

  function renderElementChrome(el: SlideDeckElement, body: React.ReactNode) {
    const sel = el.id === selectedElementId;
    const dragging = el.id === draggingId;
    const resizing = el.id === resizingId;

    return (
      <div
        key={el.id}
        role="button"
        tabIndex={0}
        className={cn(
          "group/el absolute overflow-hidden shadow-sm active:cursor-grabbing",
          el.kind === "shape" ? "cursor-grab" : "cursor-grab",
          sel ?
            "ring-2 ring-primary ring-offset-0 z-[100]"
          : "ring-1 ring-white/25 hover:ring-white/50",
          dragging && "opacity-95",
          resizing && "opacity-98"
        )}
        style={{
          left: `${el.x}%`,
          top: `${el.y}%`,
          width: `${el.w}%`,
          height: `${el.h}%`,
          zIndex: 10 + (el.zIndex ?? 0),
        }}
        onPointerDown={(e) => startDrag(el, e)}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(el.id);
        }}
      >
        {body}
        {sel ?
          <button
            type="button"
            aria-label="Redimensionar"
            className="absolute bottom-1 right-1 z-[120] h-3.5 w-3.5 cursor-se-resize rounded-sm border border-background bg-primary shadow-md pointer-events-auto"
            onPointerDown={(e) => startResize(el, e)}
          />
        : null}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      role="presentation"
      className={cn(
        "relative mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-[28px] border border-border/60 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.35)] ring-1 ring-black/[0.04] dark:ring-white/[0.06]"
      )}
      style={{
        backgroundColor: slide.background,
        ...bgStyle,
      }}
      onPointerDown={() => {
        if (useFreeform) onSelectElement(null);
      }}
    >
      {slide.backgroundImageUrl?.trim() ?
        <div
          className="pointer-events-none absolute inset-0 bg-black/25"
          aria-hidden
        />
      : null}

      {useFreeform ?
        <>
          {elements
            .slice()
            .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
            .map((el) => {
              if (el.kind === "image") {
                const url = el.imageUrl?.trim();
                const fit = el.imageFit ?? "cover";
                const op = el.imageOpacity ?? 1;
                const rad = el.imageRadius ?? 12;
                return renderElementChrome(
                  el,
                  <div className="relative h-full w-full bg-black/20">
                    {url ?
                      // eslint-disable-next-line @next/next/no-img-element -- URLs blob/https do utilizador
                      <img
                        src={url}
                        alt=""
                        className="pointer-events-none h-full w-full select-none object-center"
                        style={{
                          objectFit: fit,
                          opacity: op,
                          borderRadius: rad,
                        }}
                        draggable={false}
                      />
                    : <div className="flex h-full w-full items-center justify-center border border-dashed border-white/35 bg-black/25 px-2 text-center text-[11px] text-white/70">
                        Sem URL — use o painel ao lado
                      </div>
                    }
                  </div>
                );
              }

              if (el.kind === "shape") {
                const variant = el.shape ?? "rect";
                const fill = el.fill ?? "#6366f140";
                const stroke = el.stroke ?? "transparent";
                const sw = el.strokeWidth ?? 0;
                const op = el.shapeOpacity ?? 1;
                const rr = el.rectRadius ?? 12;
                return renderElementChrome(
                  el,
                  <div
                    className="h-full w-full"
                    style={{
                      opacity: op,
                      background: variant === "ellipse" ? fill : fill,
                      border:
                        sw > 0 && stroke && stroke !== "transparent" ?
                          `${sw}px solid ${stroke}`
                        : "none",
                      borderRadius:
                        variant === "ellipse" ? "9999px" : `${rr}px`,
                      boxSizing: "border-box",
                    }}
                  />
                );
              }

              /* heading | body */
              const fs =
                el.fontSize ?? (el.kind === "heading" ? 26 : 15);
              const fw =
                el.fontWeight ?? (el.kind === "heading" ? 700 : 400);
              const ta = el.textAlign ?? "left";

              return renderElementChrome(
                el,
                <div
                  className={cn(
                    "h-full overflow-hidden px-2 py-1",
                    ta === "center" && "text-center",
                    ta === "right" && "text-right"
                  )}
                  style={{
                    color: el.color ?? "#fff",
                    fontSize: `clamp(10px, ${fs * 0.22}vw, ${fs}px)`,
                    fontWeight: fw,
                  }}
                >
                  <div className="line-clamp-[14] h-full whitespace-pre-wrap break-words">
                    {el.text || "…"}
                  </div>
                </div>
              );
            })}
        </>
      : <div className="relative z-[1] flex h-full flex-col justify-center gap-5 px-[8%] py-[10%] text-white">
          <h2 className="text-[clamp(1.35rem,4.2vw,2.45rem)] font-extrabold leading-[1.1] tracking-tight drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)]">
            {slide.title || "Título do slide"}
          </h2>
          {slide.subtitle ?
            <p className="text-[clamp(0.95rem,2.2vw,1.35rem)] font-medium text-white/90 drop-shadow-md">
              {slide.subtitle}
            </p>
          : null}
          {bulletLines.length > 0 ?
            <ul className="list-disc space-y-2.5 pl-6 text-[clamp(0.88rem,2vw,1.12rem)] font-medium leading-snug text-white/92 marker:text-white/75">
              {bulletLines.map((line, idx) => (
                <li key={`${idx}-${line.slice(0, 32)}`}>{line}</li>
              ))}
            </ul>
          : null}
        </div>
      }
    </div>
  );
}
