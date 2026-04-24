"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { isAiQuery } from "@/lib/search/is-ai-query";

type SearchResult = {
  id: string;
  type: "aluno" | "curso" | "professor" | "pagamento";
  label: string;
  description?: string;
  href: string;
};

const TYPE_LABELS: Record<SearchResult["type"], string> = {
  aluno: "Alunos",
  curso: "Cursos",
  professor: "Professores",
  pagamento: "Pagamentos",
};

const TYPE_ORDER: SearchResult["type"][] = [
  "aluno",
  "curso",
  "professor",
  "pagamento",
];

function highlightText(text: string, query: string) {
  if (!query.trim()) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === query.toLowerCase();

    return isMatch ? (
      <mark
        key={`${part}-${index}`}
        className="rounded bg-primary/10 px-0.5 text-inherit"
      >
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    );
  });
}

export function HeaderSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResult["type"], SearchResult[]> = {
      aluno: [],
      curso: [],
      professor: [],
      pagamento: [],
    };

    for (const result of results) {
      groups[result.type].push(result);
    }

    return TYPE_ORDER.filter((type) => groups[type].length > 0).map((type) => ({
      type,
      label: TYPE_LABELS[type],
      items: groups[type],
    }));
  }, [results]);

  const flatResults = useMemo(() => {
    return groupedResults.flatMap((group) => group.items);
  }, [groupedResults]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const value = query.trim();

    if (!value || value.length < 2 || isAiQuery(value)) {
      setResults([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/search?q=${encodeURIComponent(value)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (response.ok) {
          const nextResults = Array.isArray(data.results) ? data.results : [];
          setResults(nextResults);
          setOpen(true);
          setActiveIndex(nextResults.length > 0 ? 0 : -1);
        }
      } catch (error) {
        console.error("Erro ao buscar:", error);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleSelect(result: SearchResult) {
    router.push(result.href);
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || flatResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatResults.length);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) =>
        prev <= 0 ? flatResults.length - 1 : prev - 1
      );
    }

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  let runningIndex = -1;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Buscar..."
          className="
            h-9 w-64 rounded-md border border-transparent
            bg-muted/50 pl-9 pr-3 text-sm
            text-foreground placeholder:text-muted-foreground
            focus:border-border focus:bg-background
            focus-visible:ring-2 focus-visible:ring-ring/50
          "
        />
      </div>

      {open && (results.length > 0 || loading) && (
        <div className="absolute right-0 top-full mt-2 z-50 w-[380px] max-h-[420px] overflow-y-auto rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl">
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Buscando...
            </div>
          ) : (
            <div className="space-y-3">
              {groupedResults.map((group) => (
                <div key={group.type}>
                  <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {group.label}
                  </div>

                  <div className="space-y-1">
                    {group.items.map((result) => {
                      runningIndex += 1;
                      const isActive = activeIndex === runningIndex;

                      return (
                        <button
                          key={`${result.type}-${result.id}`}
                          type="button"
                          onClick={() => handleSelect(result)}
                          className={`
                            flex w-full flex-col rounded-xl px-3 py-2.5 text-left transition
                            ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-accent"
                            }
                          `}
                        >
                          <span className="text-sm font-medium">
                            {highlightText(result.label, query)}
                          </span>

                          <div
                            className={`mt-1 flex items-center gap-2 text-xs ${
                              isActive
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            <span className="capitalize">{result.type}</span>

                            {result.description && (
                              <>
                                <span>•</span>
                                <span className="truncate">
                                  {highlightText(result.description, query)}
                                </span>
                              </>
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
      )}
    </div>
  );
}