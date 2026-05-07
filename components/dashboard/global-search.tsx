"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, GraduationCap, BookOpen, UserCircle, DollarSign, FileText } from "lucide-react";
import { isAiQuery } from "@/lib/search/is-ai-query";

type SearchResult = {
  id: string;
  type: "aluno" | "curso" | "professor" | "pagamento" | "avaliacao";
  label: string;
  description?: string;
  href: string;
};

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  aluno: "Alunos",
  curso: "Cursos",
  professor: "Professores",
  pagamento: "Pagamentos",
  avaliacao: "Avaliações",
};

const TYPE_ICONS: Record<SearchResult["type"], React.ElementType> = {
  aluno: GraduationCap,
  curso: BookOpen,
  professor: UserCircle,
  pagamento: DollarSign,
  avaliacao: FileText,
};

const TYPE_ORDER: SearchResult["type"][] = ["aluno", "curso", "professor", "pagamento", "avaliacao"];

function highlight(text: string, query: string) {
  if (!query.trim()) return <span>{text}</span>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="rounded bg-primary/15 px-0.5 text-inherit not-italic">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export function GlobalSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const gPressedRef = useRef(false);

  // Cmd+K / Ctrl+K + atalhos G+letra
  useEffect(() => {
    const NAV: Record<string, string> = {
      d: "/", a: "/alunos", f: "/financeiro",
      c: "/calendario", r: "/relatorios",
    };

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }

      if (e.key === "Escape") { setOpen(false); return; }

      if (!isInput && !e.metaKey && !e.ctrlKey) {
        if (e.key === "g" || e.key === "G") {
          gPressedRef.current = true;
          setTimeout(() => { gPressedRef.current = false; }, 1000);
          return;
        }
        if (gPressedRef.current && NAV[e.key.toLowerCase()]) {
          e.preventDefault();
          gPressedRef.current = false;
          router.push(NAV[e.key.toLowerCase()]);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const value = query.trim();
    if (!value || value.length < 2 || isAiQuery(value)) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`, { cache: "no-store" });
        const data = await res.json();
        setResults(Array.isArray(data.results) ? data.results : []);
        setActiveIndex(0);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const grouped = useMemo(() => {
    const map: Record<SearchResult["type"], SearchResult[]> = { aluno: [], curso: [], professor: [], pagamento: [], avaliacao: [] };
    for (const r of results) map[r.type].push(r);
    return TYPE_ORDER.filter((t) => map[t].length > 0).map((t) => ({ type: t, label: TYPE_LABELS[t], items: map[t] }));
  }, [results]);

  const flat = useMemo(() => grouped.flatMap((g) => g.items), [grouped]);

  const flatIndexByKey = useMemo(() => {
    const m = new Map<string, number>();
    flat.forEach((r, i) => m.set(`${r.type}-${r.id}`, i));
    return m;
  }, [flat]);

  function select(result: SearchResult) {
    router.push(result.href);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => (i + 1) % Math.max(flat.length, 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => (i <= 0 ? flat.length - 1 : i - 1)); }
    if (e.key === "Enter" && flat[activeIndex]) select(flat[activeIndex]);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl rounded-[24px] border border-border bg-popover shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Buscar alunos, provas, questões, cursos, professores..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <kbd className="hidden sm:inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Buscando...</p>
          ) : query.trim().length < 2 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Digite pelo menos 2 caracteres para buscar.</p>
          ) : grouped.length === 0 ? (
            <p className="px-3 py-4 text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          ) : (
            <div className="space-y-3">
              {grouped.map((group) => (
                <div key={group.type}>
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {group.label}
                  </p>
                  <div className="space-y-0.5">
                    {group.items.map((result) => {
                      const idx = flatIndexByKey.get(`${result.type}-${result.id}`) ?? 0;
                      const isActive = activeIndex === idx;
                      const Icon = TYPE_ICONS[result.type];
                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onClick={() => select(result)}
                          onMouseEnter={() => setActiveIndex(idx)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                            isActive ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {highlight(result.label, query)}
                            </p>
                            {result.description && (
                              <p className="truncate text-xs text-muted-foreground">
                                {highlight(result.description, query)}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
          <span><kbd className="rounded border border-border px-1">↑↓</kbd> navegar</span>
          <span><kbd className="rounded border border-border px-1">↵</kbd> abrir</span>
          <span><kbd className="rounded border border-border px-1">ESC</kbd> fechar</span>
        </div>
      </div>
    </div>
  );
}
