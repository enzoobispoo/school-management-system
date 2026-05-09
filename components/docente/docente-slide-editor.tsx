"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Check,
  Circle,
  Copy,
  Heading,
  ImageIcon,
  ImagePlus,
  Layers,
  Loader2,
  Plus,
  Presentation,
  Save,
  Square,
  Trash2,
  Type,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DocenteSlideCanvas } from "@/components/docente/docente-slide-canvas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createEmptySlideDeck,
  defaultBodyElement,
  defaultHeadingElement,
  defaultImageElement,
  defaultShapeElement,
  parseSlideDeck,
  type SlideDeckElement,
  type SlideDeckSlideV1,
  type SlideDeckV1,
} from "@/lib/docente/slide-deck";
import {
  SLIDE_TEMPLATE_META,
  replaceDeckWithTemplate,
  type SlideTemplateId,
} from "@/lib/docente/slide-templates";
import { cn } from "@/lib/utils";

function newSlideId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function cloneSlide(slide: SlideDeckSlideV1): SlideDeckSlideV1 {
  const next: SlideDeckSlideV1 = {
    ...slide,
    id: newSlideId(),
  };
  if (slide.elements?.length) {
    next.elements = slide.elements.map((e) => ({ ...e, id: newSlideId() }));
  }
  return next;
}

function elementsFromSimpleSlide(slide: SlideDeckSlideV1): SlideDeckElement[] {
  const els: SlideDeckElement[] = [];
  if (slide.title.trim()) {
    els.push({
      ...defaultHeadingElement(),
      id: newSlideId(),
      text: slide.title.trim(),
    });
  }
  if (slide.subtitle.trim()) {
    els.push({
      ...defaultBodyElement(),
      id: newSlideId(),
      text: slide.subtitle.trim(),
      y: 28,
      h: 14,
    });
  }
  const bullets = slide.bullets
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .join("\n");
  if (bullets) {
    els.push({
      ...defaultBodyElement(),
      id: newSlideId(),
      text: bullets,
      y: slide.subtitle.trim() ? 44 : 28,
      h: 46,
    });
  }
  if (!els.length) {
    return [
      { ...defaultHeadingElement(), id: newSlideId() },
      { ...defaultBodyElement(), id: newSlideId() },
    ];
  }
  return els;
}

export function DocenteSlideEditor(props: { materialId: string }) {
  const { materialId } = props;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docTitulo, setDocTitulo] = useState("");
  const [deck, setDeck] = useState<SlideDeckV1 | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const bgFileRef = useRef<HTMLInputElement | null>(null);
  const elemImgRef = useRef<HTMLInputElement | null>(null);
  const elemImgTargetIdRef = useRef<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const deckRef = useRef<SlideDeckV1 | null>(null);
  const tituloRef = useRef("");
  const [saving, setSaving] = useState(false);

  const activeSlide = deck?.slides[activeIdx] ?? null;

  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  useEffect(() => {
    tituloRef.current = docTitulo;
  }, [docTitulo]);

  useEffect(() => {
    setSelectedElementId(null);
  }, [activeIdx]);

  const scheduleSave = useCallback(
    (nextDeck: SlideDeckV1, titulo: string) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/docente/materiais/${materialId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titulo: titulo.trim(),
              slideDeckJson: nextDeck,
            }),
          });
          const j = await res.json();
          if (!res.ok) throw new Error(j.error || "Erro ao salvar.");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
        }
      }, 700);
    },
    [materialId]
  );

  const persistToServer = useCallback(async (): Promise<boolean> => {
    const d = deckRef.current;
    const t = tituloRef.current;
    if (!d) return false;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    try {
      const res = await fetch(`/api/docente/materiais/${materialId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: t.trim(),
          slideDeckJson: d,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Erro ao salvar.");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar.");
      return false;
    }
  }, [materialId]);

  async function saveAlteracoes() {
    setSaving(true);
    try {
      const ok = await persistToServer();
      if (ok) toast.success("Alterações salvas.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAndFinish() {
    setSaving(true);
    try {
      const ok = await persistToServer();
      if (ok) {
        toast.success("Apresentação salva.");
        router.push("/docente/materiais/apresentacoes");
      }
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/docente/materiais/${materialId}`, {
          cache: "no-store",
        });
        const row = await res.json();
        if (!res.ok) throw new Error(row.error || "Erro ao carregar.");
        if (cancelled) return;
        setDocTitulo(String(row.titulo ?? ""));
        const parsed = parseSlideDeck(row.slideDeckJson);
        setDeck(parsed ?? createEmptySlideDeck());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
        router.push("/docente/materiais/apresentacoes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [materialId, router]);

  function patchDeck(updater: (d: SlideDeckV1) => SlideDeckV1) {
    setDeck((prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      scheduleSave(next, docTitulo);
      return next;
    });
  }

  function updateTituloDoc(v: string) {
    tituloRef.current = v;
    setDocTitulo(v);
    if (deck) scheduleSave(deck, v);
  }

  function updateSlide(partial: Partial<SlideDeckSlideV1>) {
    if (!deck || !activeSlide) return;
    patchDeck((d) => {
      const slides = [...d.slides];
      slides[activeIdx] = { ...slides[activeIdx], ...partial };
      return { ...d, slides };
    });
  }

  function updateElements(next: SlideDeckElement[]) {
    updateSlide({ elements: next.length ? next : undefined });
  }

  function patchElement(id: string, partial: Partial<SlideDeckElement>) {
    const els = activeSlide?.elements ?? [];
    updateSlide({
      elements: els.map((e) => (e.id === id ? { ...e, ...partial } : e)),
    });
  }

  function addSlide() {
    patchDeck((d) => ({
      ...d,
      slides: [
        ...d.slides,
        {
          id: newSlideId(),
          background: "#0f172a",
          backgroundImageUrl: null,
          title: "",
          subtitle: "",
          bullets: "",
        },
      ],
    }));
    setActiveIdx((i) => i + 1);
  }

  function duplicateSlide() {
    if (!deck || !activeSlide) return;
    const copy = cloneSlide(activeSlide);
    copy.title = `${activeSlide.title} (cópia)`.slice(0, 200);
    patchDeck((d) => {
      const slides = [...d.slides];
      slides.splice(activeIdx + 1, 0, copy);
      return { ...d, slides };
    });
    setActiveIdx((i) => i + 1);
  }

  function removeSlide() {
    if (!deck || deck.slides.length <= 1) return;
    const nextLen = deck.slides.length - 1;
    patchDeck((d) => ({
      ...d,
      slides: d.slides.filter((_, i) => i !== activeIdx),
    }));
    setActiveIdx((i) => Math.min(i, Math.max(0, nextLen - 1)));
  }

  function convertToFreeform() {
    if (!activeSlide) return;
    const els = elementsFromSimpleSlide(activeSlide);
    updateSlide({ elements: els });
    setSelectedElementId(els[0]?.id ?? null);
    toast.message("Modo livre ativo — arraste as caixas no slide.");
  }

  function addHeadingBox() {
    const els = [...(activeSlide?.elements ?? [])];
    els.push({ ...defaultHeadingElement(), id: newSlideId() });
    updateSlide({ elements: els });
    setSelectedElementId(els.at(-1)!.id);
  }

  function addBodyBox() {
    const els = [...(activeSlide?.elements ?? [])];
    els.push({ ...defaultBodyElement(), id: newSlideId() });
    updateSlide({ elements: els });
    setSelectedElementId(els.at(-1)!.id);
  }

  function addImageBox() {
    const els = [...(activeSlide?.elements ?? [])];
    const img = { ...defaultImageElement(), id: newSlideId() };
    els.push(img);
    updateSlide({ elements: els });
    setSelectedElementId(img.id);
    toast.message("Cole a URL da imagem ou envie um arquivo no painel abaixo.");
  }

  function addShapeRect() {
    const els = [...(activeSlide?.elements ?? [])];
    const sh = { ...defaultShapeElement("rect"), id: newSlideId() };
    els.push(sh);
    updateSlide({ elements: els });
    setSelectedElementId(sh.id);
  }

  function addShapeEllipse() {
    const els = [...(activeSlide?.elements ?? [])];
    const sh = { ...defaultShapeElement("ellipse"), id: newSlideId() };
    els.push(sh);
    updateSlide({ elements: els });
    setSelectedElementId(sh.id);
  }

  function bringForward() {
    if (!activeSlide?.elements?.length || !selectedElementId) return;
    const els = activeSlide.elements;
    const maxZ = Math.max(...els.map((e) => e.zIndex ?? 0), 0);
    patchElement(selectedElementId, { zIndex: maxZ + 1 });
  }

  function sendBackward() {
    if (!activeSlide?.elements?.length || !selectedElementId) return;
    const els = activeSlide.elements;
    const minZ = Math.min(...els.map((e) => e.zIndex ?? 0), 0);
    patchElement(selectedElementId, { zIndex: minZ - 1 });
  }

  function triggerElementImageUpload() {
    if (!selectedElementId) return;
    elemImgTargetIdRef.current = selectedElementId;
    elemImgRef.current?.click();
  }

  async function uploadElementImage(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    const tid = elemImgTargetIdRef.current;
    elemImgTargetIdRef.current = null;
    if (!file || !tid) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/docente/materiais/slide-asset", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(j.error || "Falha no upload.");
      if (!j.url) throw new Error("URL não retornada.");
      patchElement(tid, { imageUrl: j.url });
      toast.success("Imagem aplicada ao elemento.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload.");
    }
  }

  function removeSelectedBox() {
    if (!activeSlide || !selectedElementId) return;
    const els = (activeSlide.elements ?? []).filter((e) => e.id !== selectedElementId);
    updateSlide({ elements: els.length ? els : undefined });
    setSelectedElementId(null);
  }

  function applyTemplate(tid: SlideTemplateId) {
    if (!deck) return;
    const ok =
      typeof window !== "undefined" ?
        window.confirm(
          "O modelo substitui todos os slides desta apresentação. Deseja continuar?"
        )
      : true;
    if (!ok) return;
    const next = replaceDeckWithTemplate(deck, tid);
    setDeck(next);
    scheduleSave(next, docTitulo);
    setActiveIdx(0);
    setSelectedElementId(null);
    toast.success("Modelo aplicado — edite textos, cores e fotos de fundo.");
  }

  async function uploadBackground(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/docente/materiais/slide-asset", {
        method: "POST",
        body: fd,
      });
      const j = (await res.json()) as { error?: string; url?: string };
      if (!res.ok) throw new Error(j.error || "Falha no upload.");
      if (!j.url) throw new Error("URL não retornada.");
      updateSlide({ backgroundImageUrl: j.url });
      toast.success("Imagem de fundo aplicada.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload.");
    }
  }

  const bulletLines = useMemo(() => {
    if (!activeSlide) return [];
    return activeSlide.bullets
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  }, [activeSlide]);

  const isFreeform = Boolean(activeSlide?.elements?.length);
  const selectedEl =
    activeSlide?.elements?.find((e) => e.id === selectedElementId) ?? null;

  if (loading || !deck) {
    return (
      <DashboardLayout>
        <Header title="Editor de slides" description="Carregando…" />
        <div className="flex justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header
        title="Editor de apresentação"
        description="As edições também são gravadas automaticamente após um breve intervalo. Use Salvar alterações para gravar na hora ou Salvar e concluir quando terminar."
      />

      <div className="space-y-5 p-4 pb-10 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente/materiais/apresentacoes">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à biblioteca
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl"
              disabled={saving}
              onClick={() => void saveAlteracoes()}
            >
              {saving ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : <Save className="h-4 w-4" />}
              Salvar alterações
            </Button>
            <Button
              type="button"
              size="sm"
              className="gap-2 rounded-xl"
              disabled={saving}
              onClick={() => void saveAndFinish()}
            >
              {saving ?
                <Loader2 className="h-4 w-4 animate-spin" />
              : <Check className="h-4 w-4" />}
              Salvar e concluir
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]">
          <div className="space-y-3 rounded-[28px] border border-border/60 bg-card/95 p-4 shadow-[0_12px_40px_-24px_rgba(99,102,241,0.35)]">
            <Label className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              Título da apresentação
            </Label>
            <Input
              value={docTitulo}
              onChange={(e) => updateTituloDoc(e.target.value)}
              className="rounded-xl"
              placeholder="Ex.: Revisão — funções"
            />
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="gap-1 rounded-xl"
                onClick={addSlide}
              >
                <Plus className="h-4 w-4" />
                Slide
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 rounded-xl"
                onClick={duplicateSlide}
                disabled={!activeSlide}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 rounded-xl text-destructive hover:text-destructive"
                onClick={removeSlide}
                disabled={deck.slides.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="h-[min(52vh,420px)] pr-2">
              <ul className="flex flex-col gap-2">
                {deck.slides.map((s, idx) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => setActiveIdx(idx)}
                      className={cn(
                        "flex w-full items-start gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        idx === activeIdx ?
                          "border-primary/40 bg-primary/5"
                        : "border-border/60 hover:bg-muted/40"
                      )}
                    >
                      <Presentation className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="line-clamp-2">
                        {s.title.trim() || `Slide ${idx + 1}`}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <div className="rounded-[22px] border border-border/50 bg-muted/25 p-4 dark:bg-muted/15">
              <div className="mb-3 flex items-center gap-2">
                <Layers className="h-4 w-4 text-muted-foreground" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Modelos rápidos
                </span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(Object.keys(SLIDE_TEMPLATE_META) as SlideTemplateId[]).map((tid) => {
                  const meta = SLIDE_TEMPLATE_META[tid];
                  return (
                    <button
                      key={tid}
                      type="button"
                      onClick={() => applyTemplate(tid)}
                      className={cn(
                        "min-w-[148px] shrink-0 rounded-2xl border px-3 py-3 text-left transition hover:bg-background/80",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      )}
                      style={{
                        borderColor: `${meta.accent}55`,
                        boxShadow: `inset 0 0 0 1px ${meta.accent}22`,
                      }}
                      title={meta.description}
                    >
                      <span
                        className="inline-block h-2 w-8 rounded-full"
                        style={{ backgroundColor: meta.accent }}
                      />
                      <p className="mt-2 text-xs font-semibold leading-tight text-foreground">
                        {meta.label}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                        {meta.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {!isFreeform ?
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-1 rounded-xl"
                  onClick={convertToFreeform}
                  disabled={!activeSlide}
                >
                  Modo livre (arrastar)
                </Button>
              : <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl"
                    onClick={addHeadingBox}
                  >
                    <Heading className="h-4 w-4" />
                    Título
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl"
                    onClick={addBodyBox}
                  >
                    <Type className="h-4 w-4" />
                    Texto
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl"
                    onClick={addImageBox}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Imagem
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl"
                    onClick={addShapeRect}
                    title="Retângulo / faixa"
                  >
                    <Square className="h-4 w-4" />
                    Retângulo
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl"
                    onClick={addShapeEllipse}
                    title="Elipse / círculo"
                  >
                    <Circle className="h-4 w-4" />
                    Elipse
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1 rounded-xl text-destructive hover:text-destructive"
                    onClick={removeSelectedBox}
                    disabled={!selectedElementId}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </>
              }
              <input
                ref={elemImgRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={uploadElementImage}
              />
              <input
                ref={bgFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={uploadBackground}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1 rounded-xl"
                disabled={!activeSlide}
                onClick={() => bgFileRef.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Fundo (upload)
              </Button>
            </div>

            {activeSlide ?
              <div className="rounded-[32px] bg-gradient-to-br from-fuchsia-500/15 via-violet-500/10 to-sky-400/15 p-1 sm:p-2 shadow-[0_24px_60px_-28px_rgba(79,70,229,0.45)]">
                <DocenteSlideCanvas
                  slide={activeSlide}
                  bulletLines={bulletLines}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onUpdateElements={updateElements}
                />
              </div>
            : null}

            {activeSlide ?
              <div className="mx-auto grid max-w-4xl gap-4 rounded-2xl border border-border/60 bg-muted/15 p-4 dark:bg-muted/10">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Cor de fundo</Label>
                    <Input
                      type="color"
                      value={activeSlide.background}
                      onChange={(e) => updateSlide({ background: e.target.value })}
                      className="h-11 w-full cursor-pointer rounded-xl"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>URL imagem de fundo</Label>
                    <Input
                      value={activeSlide.backgroundImageUrl ?? ""}
                      onChange={(e) =>
                        updateSlide({
                          backgroundImageUrl:
                            e.target.value.trim() === "" ? null : e.target.value.trim(),
                        })
                      }
                      placeholder="https://… ou use Upload"
                      className="rounded-xl font-mono text-xs"
                    />
                  </div>
                </div>

                {!isFreeform ?
                  <>
                    <div className="grid gap-2">
                      <Label>Título</Label>
                      <Input
                        value={activeSlide.title}
                        onChange={(e) => updateSlide({ title: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Subtítulo</Label>
                      <Input
                        value={activeSlide.subtitle}
                        onChange={(e) => updateSlide({ subtitle: e.target.value })}
                        className="rounded-xl"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Marcadores (um por linha)</Label>
                      <Textarea
                        value={activeSlide.bullets}
                        onChange={(e) => updateSlide({ bullets: e.target.value })}
                        rows={6}
                        className="rounded-xl font-[inherit] text-sm"
                      />
                    </div>
                  </>
                : <>
                    <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      Modo livre: clique num elemento.{" "}
                      <span className="font-semibold text-foreground">Arraste</span> para mover; use o{" "}
                      <span className="font-semibold text-foreground">quadradinho roxo</span> no canto
                      inferior direito para redimensionar.
                    </div>
                    {selectedEl ?
                      <div className="grid gap-5">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-xl"
                            onClick={bringForward}
                          >
                            <ArrowUp className="h-4 w-4" />
                            Camada ↑
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="gap-1 rounded-xl"
                            onClick={sendBackward}
                          >
                            <ArrowDown className="h-4 w-4" />
                            Camada ↓
                          </Button>
                          <span className="self-center text-[11px] text-muted-foreground">
                            Tipo:{" "}
                            <span className="font-medium capitalize text-foreground">
                              {selectedEl.kind === "shape" ?
                                selectedEl.shape === "ellipse" ?
                                  "Elipse"
                                : "Retângulo"
                              : selectedEl.kind === "image" ?
                                "Imagem"
                              : selectedEl.kind === "heading" ?
                                "Título"
                              : "Texto"}
                            </span>
                          </span>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Posição X (%)</Label>
                            <Input
                              type="number"
                              step={0.5}
                              min={0}
                              max={100}
                              value={selectedEl.x}
                              onChange={(e) =>
                                patchElement(selectedEl.id, {
                                  x: Number(e.target.value),
                                })
                              }
                              className="rounded-xl"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Posição Y (%)</Label>
                            <Input
                              type="number"
                              step={0.5}
                              min={0}
                              max={100}
                              value={selectedEl.y}
                              onChange={(e) =>
                                patchElement(selectedEl.id, {
                                  y: Number(e.target.value),
                                })
                              }
                              className="rounded-xl"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Largura (%)</Label>
                            <Input
                              type="number"
                              step={0.5}
                              min={4}
                              max={100}
                              value={selectedEl.w}
                              onChange={(e) =>
                                patchElement(selectedEl.id, {
                                  w: Number(e.target.value),
                                })
                              }
                              className="rounded-xl"
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label className="text-xs">Altura (%)</Label>
                            <Input
                              type="number"
                              step={0.5}
                              min={3}
                              max={100}
                              value={selectedEl.h}
                              onChange={(e) =>
                                patchElement(selectedEl.id, {
                                  h: Number(e.target.value),
                                })
                              }
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        {(selectedEl.kind === "heading" || selectedEl.kind === "body") ?
                          <>
                            <div className="grid gap-2">
                              <Label>Conteúdo</Label>
                              <Textarea
                                value={selectedEl.text ?? ""}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, { text: e.target.value })
                                }
                                rows={5}
                                className="rounded-xl text-sm"
                              />
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                              <div className="grid gap-1.5">
                                <Label className="text-xs">Tamanho (px)</Label>
                                <Input
                                  type="number"
                                  min={8}
                                  max={120}
                                  value={
                                    selectedEl.fontSize ??
                                    (selectedEl.kind === "heading" ? 28 : 16)
                                  }
                                  onChange={(e) =>
                                    patchElement(selectedEl.id, {
                                      fontSize: Number(e.target.value) || undefined,
                                    })
                                  }
                                  className="rounded-xl"
                                />
                              </div>
                              <div className="grid gap-1.5">
                                <Label className="text-xs">Peso da fonte</Label>
                                <Select
                                  value={String(
                                    selectedEl.fontWeight ??
                                      (selectedEl.kind === "heading" ? 700 : 400)
                                  )}
                                  onValueChange={(v) =>
                                    patchElement(selectedEl.id, {
                                      fontWeight: Number(v),
                                    })
                                  }
                                >
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {[400, 500, 600, 700, 800, 900].map((w) => (
                                      <SelectItem key={w} value={String(w)}>
                                        {w}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-1.5 sm:col-span-2">
                                <Label className="text-xs">Alinhamento</Label>
                                <Select
                                  value={selectedEl.textAlign ?? "left"}
                                  onValueChange={(v) =>
                                    patchElement(selectedEl.id, {
                                      textAlign: v as "left" | "center" | "right",
                                    })
                                  }
                                >
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="left">Esquerda</SelectItem>
                                    <SelectItem value="center">Centro</SelectItem>
                                    <SelectItem value="right">Direita</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-1.5">
                                <Label className="text-xs">Cor</Label>
                                <Input
                                  type="color"
                                  value={
                                    selectedEl.color ??
                                    (selectedEl.kind === "heading" ?
                                      "#ffffff"
                                    : "#e2e8f0")
                                  }
                                  onChange={(e) =>
                                    patchElement(selectedEl.id, {
                                      color: e.target.value,
                                    })
                                  }
                                  className="h-11 w-full cursor-pointer rounded-xl"
                                />
                              </div>
                            </div>
                          </>
                        : null}

                        {selectedEl.kind === "image" ?
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-2 sm:col-span-2">
                              <Label>URL da imagem</Label>
                              <Input
                                value={selectedEl.imageUrl ?? ""}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    imageUrl:
                                      e.target.value.trim() === "" ?
                                        null
                                      : e.target.value.trim(),
                                  })
                                }
                                placeholder="https://…"
                                className="rounded-xl font-mono text-xs"
                              />
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                className="w-fit gap-1 rounded-xl"
                                onClick={triggerElementImageUpload}
                              >
                                <ImagePlus className="h-4 w-4" />
                                Enviar arquivo…
                              </Button>
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Ajuste</Label>
                              <Select
                                value={selectedEl.imageFit ?? "cover"}
                                onValueChange={(v) =>
                                  patchElement(selectedEl.id, {
                                    imageFit: v as "cover" | "contain",
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="cover">Preencher (cover)</SelectItem>
                                  <SelectItem value="contain">Inteira (contain)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Opacidade (0,05–1)</Label>
                              <Input
                                type="number"
                                step={0.05}
                                min={0.05}
                                max={1}
                                value={selectedEl.imageOpacity ?? 1}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    imageOpacity: Number(e.target.value),
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Cantos (px)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={48}
                                value={selectedEl.imageRadius ?? 14}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    imageRadius: Number(e.target.value),
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                          </div>
                        : null}

                        {selectedEl.kind === "shape" ?
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Forma</Label>
                              <Select
                                value={selectedEl.shape ?? "rect"}
                                onValueChange={(v) =>
                                  patchElement(selectedEl.id, {
                                    shape: v as "rect" | "ellipse",
                                  })
                                }
                              >
                                <SelectTrigger className="rounded-xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="rect">Retângulo</SelectItem>
                                  <SelectItem value="ellipse">Elipse</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Opacidade</Label>
                              <Input
                                type="number"
                                step={0.05}
                                min={0.05}
                                max={1}
                                value={selectedEl.shapeOpacity ?? 1}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    shapeOpacity: Number(e.target.value),
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Preenchimento</Label>
                              <Input
                                type="color"
                                value={
                                  selectedEl.fill?.startsWith("#") &&
                                  selectedEl.fill.length >= 7 ?
                                    selectedEl.fill.slice(0, 7)
                                  : "#6366f1"
                                }
                                onChange={(e) =>
                                  patchElement(selectedEl.id, { fill: e.target.value })
                                }
                                className="h-11 w-full cursor-pointer rounded-xl"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Contorno</Label>
                              <Input
                                type="color"
                                value={
                                  selectedEl.stroke?.startsWith("#") &&
                                  selectedEl.stroke.length >= 7 ?
                                    selectedEl.stroke.slice(0, 7)
                                  : "#ffffff"
                                }
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    stroke: e.target.value,
                                  })
                                }
                                className="h-11 w-full cursor-pointer rounded-xl"
                              />
                            </div>
                            <div className="grid gap-1.5">
                              <Label className="text-xs">Espessura contorno (px)</Label>
                              <Input
                                type="number"
                                min={0}
                                max={12}
                                value={selectedEl.strokeWidth ?? 2}
                                onChange={(e) =>
                                  patchElement(selectedEl.id, {
                                    strokeWidth: Number(e.target.value),
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                            {(selectedEl.shape ?? "rect") === "rect" ?
                              <div className="grid gap-1.5">
                                <Label className="text-xs">Raio dos cantos (px)</Label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={48}
                                  value={selectedEl.rectRadius ?? 14}
                                  onChange={(e) =>
                                    patchElement(selectedEl.id, {
                                      rectRadius: Number(e.target.value),
                                    })
                                  }
                                  className="rounded-xl"
                                />
                              </div>
                            : null}
                          </div>
                        : null}
                      </div>
                    : <p className="text-sm text-muted-foreground">
                        Selecione um elemento no slide para editar propriedades.
                      </p>
                    }
                  </>
                }
              </div>
            : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
