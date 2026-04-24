"use client";

import { Button } from "@/components/ui/button";

interface Props {
  page: number;
  setPage: (value: number | ((prev: number) => number)) => void;
  meta: {
    total: number;
    totalPages: number;
  };
  loading: boolean;
  currentCount: number;
}

export function FinancialPagination({
  page,
  setPage,
  meta,
  loading,
  currentCount,
}: Props) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
      <span>
        Mostrando {currentCount} de {meta.total} pagamentos
      </span>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1 || loading}
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
        >
          Anterior
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= meta.totalPages || loading}
          onClick={() => setPage((prev) => prev + 1)}
        >
          Próximo
        </Button>
      </div>
    </div>
  );
}