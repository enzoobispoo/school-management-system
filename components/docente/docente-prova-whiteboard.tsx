"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Eraser, Minus, Pencil, Square, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";

export type WBElement =
  | {
      t: "path";
      points: { x: number; y: number }[];
      color: string;
      width: number;
      eraser: boolean;
    }
  | { t: "rect"; x: number; y: number; w: number; h: number; color: string; width: number }
  | {
      t: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      color: string;
      width: number;
    }
  | {
      t: "line";
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      width: number;
    };

type Tool = "pen" | "eraser" | "rect" | "ellipse" | "line";

function parseStored(raw: string | null): WBElement[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(Boolean) as WBElement[];
  } catch {
    return [];
  }
}

function drawPath(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  width: number,
  eraser: boolean
) {
  if (points.length < 2) return;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = eraser ? Math.max(width * 3, 12) : width;
  ctx.globalCompositeOperation = eraser ? "destination-out" : "source-over";
  ctx.strokeStyle = eraser ? "rgba(0,0,0,1)" : ctx.strokeStyle;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

export function DocenteProvaWhiteboard(props: { storageKey: string }) {
  const { storageKey } = props;
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cssSizeRef = useRef({ w: 320, h: 280 });
  const elementsRef = useRef<WBElement[]>([]);
  const [elements, setElements] = useState<WBElement[]>([]);
  const [history, setHistory] = useState<WBElement[][]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(4);
  const draggingRef = useRef(false);
  const draftPathRef = useRef<{ x: number; y: number }[]>([]);
  const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const redraw = useCallback((draft?: WBElement | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.save();
    const dark =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("dark");
    ctx.fillStyle = dark ? "rgba(15,23,42,0.55)" : "rgba(255,255,255,0.92)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const el of elements) {
      ctx.globalCompositeOperation = "source-over";
      if (el.t === "path") {
        ctx.strokeStyle = el.color;
        drawPath(ctx, el.points, el.width, el.eraser);
      } else if (el.t === "rect") {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.strokeRect(el.x, el.y, el.w, el.h);
      } else if (el.t === "ellipse") {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.beginPath();
        ctx.ellipse(el.cx, el.cy, Math.abs(el.rx), Math.abs(el.ry), 0, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.t === "line") {
        ctx.strokeStyle = el.color;
        ctx.lineWidth = el.width;
        ctx.beginPath();
        ctx.moveTo(el.x1, el.y1);
        ctx.lineTo(el.x2, el.y2);
        ctx.stroke();
      }
    }

    if (draft?.t === "path") {
      ctx.strokeStyle = draft.color;
      drawPath(ctx, draft.points, draft.width, draft.eraser);
    } else if (draft?.t === "rect") {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = draft.color;
      ctx.lineWidth = draft.width;
      ctx.strokeRect(draft.x, draft.y, draft.w, draft.h);
      ctx.setLineDash([]);
    } else if (draft?.t === "ellipse") {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = draft.color;
      ctx.lineWidth = draft.width;
      ctx.beginPath();
      ctx.ellipse(draft.cx, draft.cy, Math.abs(draft.rx), Math.abs(draft.ry), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (draft?.t === "line") {
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = draft.color;
      ctx.lineWidth = draft.width;
      ctx.beginPath();
      ctx.moveTo(draft.x1, draft.y1);
      ctx.lineTo(draft.x2, draft.y2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }, [elements]);

  useEffect(() => {
    setElements(parseStored(typeof window !== "undefined" ? localStorage.getItem(storageKey) : null));
    setHistory([]);
  }, [storageKey]);

  useEffect(() => {
    redraw();
  }, [elements, redraw]);

  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);

  useEffect(() => {
    const el = wrapRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const fit = () => {
      const rect = el.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.floor(rect.width));
      const h = Math.max(280, Math.floor(rect.height));
      cssSizeRef.current = { w, h };
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      redraw();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(() => {
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(elements));
      } catch {
        /* ignore quota */
      }
    }, 400);
    return () => {
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    };
  }, [elements, storageKey]);

  function canvasCoords(ev: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { w, h } = cssSizeRef.current;
    const x = ((ev.clientX - rect.left) / Math.max(rect.width, 1)) * w;
    const y = ((ev.clientY - rect.top) / Math.max(rect.height, 1)) * h;
    return { x, y };
  }

  function pushHistory() {
    setHistory((h) => [...h.slice(-40), elementsRef.current]);
  }

  function undo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setElements(prev);
      return h.slice(0, -1);
    });
  }

  function canvasDraft(ev: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = canvasCoords(ev);
    const start = shapeStartRef.current;
    if (tool === "pen" || tool === "eraser") {
      const pts = draftPathRef.current;
      redraw({
        t: "path",
        points: pts,
        color,
        width: lineWidth,
        eraser: tool === "eraser",
      });
      return;
    }
    if (!start) return;
    if (tool === "rect") {
      redraw({
        t: "rect",
        x: Math.min(start.x, x),
        y: Math.min(start.y, y),
        w: Math.abs(x - start.x),
        h: Math.abs(y - start.y),
        color,
        width: lineWidth,
      });
    } else if (tool === "ellipse") {
      redraw({
        t: "ellipse",
        cx: (start.x + x) / 2,
        cy: (start.y + y) / 2,
        rx: Math.abs(x - start.x) / 2,
        ry: Math.abs(y - start.y) / 2,
        color,
        width: lineWidth,
      });
    } else if (tool === "line") {
      redraw({
        t: "line",
        x1: start.x,
        y1: start.y,
        x2: x,
        y2: y,
        color,
        width: lineWidth,
      });
    }
  }

  function onDown(ev: React.MouseEvent<HTMLCanvasElement>) {
    pushHistory();
    draggingRef.current = true;
    const { x, y } = canvasCoords(ev);
    if (tool === "pen" || tool === "eraser") {
      draftPathRef.current = [{ x, y }];
      redraw({
        t: "path",
        points: draftPathRef.current,
        color,
        width: lineWidth,
        eraser: tool === "eraser",
      });
      return;
    }
    shapeStartRef.current = { x, y };
    canvasDraft(ev);
  }

  function onMove(ev: React.MouseEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return;
    const { x, y } = canvasCoords(ev);
    if (tool === "pen" || tool === "eraser") {
      draftPathRef.current.push({ x, y });
      canvasDraft(ev);
      return;
    }
    canvasDraft(ev);
  }

  function onUp(ev: React.MouseEvent<HTMLCanvasElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const { x, y } = canvasCoords(ev);
    if (tool === "pen" || tool === "eraser") {
      const pts = draftPathRef.current;
      draftPathRef.current = [];
      if (pts.length >= 2) {
        setElements((els) => [
          ...els,
          {
            t: "path",
            points: pts,
            color,
            width: lineWidth,
            eraser: tool === "eraser",
          },
        ]);
      }
      redraw();
      return;
    }
    const start = shapeStartRef.current;
    shapeStartRef.current = null;
    if (!start) return;
    if (tool === "rect") {
      const rw = Math.abs(x - start.x);
      const rh = Math.abs(y - start.y);
      if (rw >= 4 || rh >= 4) {
        setElements((els) => [
          ...els,
          {
            t: "rect",
            x: Math.min(start.x, x),
            y: Math.min(start.y, y),
            w: rw,
            h: rh,
            color,
            width: lineWidth,
          },
        ]);
      }
    } else if (tool === "ellipse") {
      const rx = Math.abs(x - start.x) / 2;
      const ry = Math.abs(y - start.y) / 2;
      if (rx >= 3 || ry >= 3) {
        setElements((els) => [
          ...els,
          {
            t: "ellipse",
            cx: (start.x + x) / 2,
            cy: (start.y + y) / 2,
            rx,
            ry,
            color,
            width: lineWidth,
          },
        ]);
      }
    } else if (tool === "line") {
      const dx = Math.abs(x - start.x);
      const dy = Math.abs(y - start.y);
      if (dx >= 4 || dy >= 4) {
        setElements((els) => [
          ...els,
          {
            t: "line",
            x1: start.x,
            y1: start.y,
            x2: x,
            y2: y,
            color,
            width: lineWidth,
          },
        ]);
      }
    }
    redraw();
  }

  function clearBoard() {
    pushHistory();
    setElements([]);
  }

  const palette = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#0f172a"];

  return (
    <div className="flex min-h-[420px] flex-col rounded-2xl border border-border/60 bg-muted/10">
      <div ref={wrapRef} className="relative min-h-[320px] flex-1">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block touch-none cursor-crosshair rounded-xl"
          onMouseDown={onDown}
          onMouseLeave={() => {
            draggingRef.current = false;
            draftPathRef.current = [];
            shapeStartRef.current = null;
            redraw();
          }}
          onMouseMove={onMove}
          onMouseUp={onUp}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/50 bg-card/40 px-3 py-3">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Ferramentas</span>
        <Button
          type="button"
          size="sm"
          variant={tool === "pen" ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => setTool("pen")}
          aria-label="Lápis"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === "eraser" ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => setTool("eraser")}
          aria-label="Borracha"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === "rect" ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => setTool("rect")}
          aria-label="Retângulo"
        >
          <Square className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === "ellipse" ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => setTool("ellipse")}
          aria-label="Elipse"
        >
          <Circle className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={tool === "line" ? "secondary" : "outline"}
          className="rounded-xl"
          onClick={() => setTool("line")}
          aria-label="Linha"
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="mx-2 h-6 w-px bg-border/70" />

        <span className="text-xs text-muted-foreground">Cor</span>
        <div className="flex flex-wrap gap-1">
          {palette.map((c) => (
            <button
              key={c}
              type="button"
              className={`h-7 w-7 rounded-full border-2 ${color === c ? "border-primary ring-2 ring-primary/30" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Cor ${c}`}
            />
          ))}
        </div>

        <div className="mx-2 hidden h-6 w-px bg-border/70 sm:block" />

        <span className="text-xs text-muted-foreground">Espessura</span>
        <Slider
          className="w-24"
          min={2}
          max={18}
          step={1}
          value={[lineWidth]}
          onValueChange={(v) => setLineWidth(v[0] ?? 4)}
        />

        <div className="mx-2 h-6 w-px bg-border/70" />

        <Button type="button" size="sm" variant="outline" className="rounded-xl" onClick={undo}>
          <Undo2 className="mr-1 h-4 w-4" />
          Desfazer
        </Button>
        <Button type="button" size="sm" variant="outline" className="rounded-xl text-destructive" onClick={clearBoard}>
          <Trash2 className="mr-1 h-4 w-4" />
          Limpar
        </Button>
      </div>
      <p className="border-t border-border/40 px-3 pb-2 pt-0 text-[11px] text-muted-foreground">
        Anotações salvas só neste navegador (local). Use para correção ou apresentação em sala.
      </p>
    </div>
  );
}
