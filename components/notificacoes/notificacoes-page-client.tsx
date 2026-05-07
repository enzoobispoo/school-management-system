"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InboxFilter = "todas" | "nao_lidas" | "lidas";

interface NotificacaoRow {
  id: string;
  tipo: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  entidadeTipo: string;
  entidadeId: string | null;
  createdAt: string;
  linkHref?: string | null;
}

interface ListMeta {
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const tipoLabels: Record<string, string> = {
  NOVO_ALUNO: "Novo aluno",
  NOVA_MATRICULA: "Nova matrícula",
  PAGAMENTO_CONFIRMADO: "Pagamento confirmado",
  PAGAMENTO_ATRASADO: "Pagamento atrasado",
  MATRICULA_CANCELADA: "Matrícula cancelada",
  SISTEMA: "Sistema",
  PAGAMENTO: "Pagamento",
  TROCA_PROFESSOR_SOLICITADA: "Convite — troca de turma",
};

function formatWhen(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function NotificacoesPageClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filter = useMemo<InboxFilter>(() => {
    const lida = searchParams.get("lida");
    if (lida === "false") return "nao_lidas";
    if (lida === "true") return "lidas";
    return "todas";
  }, [searchParams]);

  const page = Math.max(Number(searchParams.get("page") || "1"), 1);

  const [items, setItems] = useState<NotificacaoRow[]>([]);
  const [meta, setMeta] = useState<ListMeta>({
    total: 0,
    unreadCount: 0,
    page: 1,
    pageSize: 25,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markAllBusy, setMarkAllBusy] = useState(false);
  const [markOneBusy, setMarkOneBusy] = useState<string | null>(null);

  const setFilter = useCallback(
    (next: InboxFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("page");
      if (next === "todas") params.delete("lida");
      else if (next === "nao_lidas") params.set("lida", "false");
      else params.set("lida", "true");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const setPage = useCallback(
    (nextPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextPage <= 1) params.delete("page");
      else params.set("page", String(nextPage));
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      params.set("limit", "25");
      params.set("page", String(page));
      if (filter === "nao_lidas") params.set("lida", "false");
      if (filter === "lidas") params.set("lida", "true");

      const res = await fetch(`/api/notificacoes?${params}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar");
      const json = await res.json();
      setItems(json.data ?? []);
      setMeta(json.meta);
    } catch {
      setError("Não foi possível carregar as notificações.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const markAllRead = async () => {
    try {
      setMarkAllBusy(true);
      const res = await fetch("/api/notificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marcarTodasComoLidas: true }),
      });
      if (!res.ok) throw new Error();
      await fetchList();
    } finally {
      setMarkAllBusy(false);
    }
  };

  const markOneRead = async (id: string) => {
    try {
      setMarkOneBusy(id);
      const res = await fetch(`/api/notificacoes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lida: true }),
      });
      if (!res.ok) throw new Error();
      await fetchList();
    } finally {
      setMarkOneBusy(null);
    }
  };

  return (
    <DashboardLayout>
      <Header
        title="Notificações"
        description="Alertas da escola conforme seu perfil — secretaria, financeiro ou professor."
      />

      <div className="space-y-6 px-6 pb-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["todas", "Todas"],
                ["nao_lidas", "Não lidas"],
                ["lidas", "Lidas"],
              ] as const
            ).map(([key, label]) => (
              <Button
                key={key}
                type="button"
                variant={filter === key ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setFilter(key)}
              >
                {label}
                {key === "nao_lidas" && meta.unreadCount > 0 ? (
                  <span className="ml-2 rounded-full bg-background/20 px-2 py-0.5 text-[11px] font-semibold">
                    {meta.unreadCount}
                  </span>
                ) : null}
              </Button>
            ))}
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full"
            disabled={markAllBusy || meta.unreadCount === 0}
            onClick={markAllRead}
          >
            Marcar todas como lidas
          </Button>
        </div>

        {error ? (
          <div className="rounded-3xl border border-destructive/25 bg-destructive/5 px-5 py-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[24px] border border-border/50 bg-card p-8 text-sm text-muted-foreground">
            Carregando…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-[24px] border border-border/50 bg-card p-10 text-center text-sm text-muted-foreground">
            Nenhuma notificação neste filtro.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((n) => (
              <li
                key={n.id}
                className={cn(
                  "rounded-[20px] border border-border/60 bg-card p-5 shadow-sm transition-colors",
                  !n.lida && "border-primary/25 bg-primary/[0.03]"
                )}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {tipoLabels[n.tipo] ?? n.tipo}
                      </span>
                      {!n.lida ? (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          Nova
                        </span>
                      ) : null}
                    </div>
                    <p className="text-base font-semibold text-foreground">
                      {n.titulo}
                    </p>
                    <p className="text-sm text-muted-foreground">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatWhen(n.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center">
                    {n.linkHref ? (
                      <Button
                        asChild
                        variant="secondary"
                        size="sm"
                        className="rounded-full"
                      >
                        <Link href={n.linkHref}>Ver detalhes</Link>
                      </Button>
                    ) : null}
                    {!n.lida ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-full"
                        disabled={markOneBusy === n.id}
                        onClick={() => markOneRead(n.id)}
                      >
                        Marcar como lida
                      </Button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {!loading && meta.totalPages > 1 ? (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Página {meta.page} de {meta.totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Próximo
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
