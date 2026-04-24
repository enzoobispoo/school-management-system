"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Payment {
  id: string;
  student: string;
  amount: number;
  competenciaMes: number;
  competenciaAno: number;
  competence: string;
}

interface PagamentosResponse {
  data: Array<{
    id: string;
    valor: number;
    competenciaMes: number;
    competenciaAno: number;
    matricula: {
      aluno: {
        nome: string;
      };
    };
  }>;
}

function formatCompetence(month: number, year: number) {
  return `${String(month).padStart(2, "0")}/${year}`;
}

function formatCurrency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

export function ChargeStudentsModal() {
  const [open, setOpen] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCompetence, setSelectedCompetence] = useState("all");

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [chargingAll, setChargingAll] = useState(false);
  const [chargingId, setChargingId] = useState<string | null>(null);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function handleOpen() {
      setOpen(true);
      setSelectedIds([]);
      setSuccessMessage("");
      setErrorMessage("");
      fetchPayments();
    }

    window.addEventListener("openChargeStudentsModal", handleOpen);

    return () => {
      window.removeEventListener("openChargeStudentsModal", handleOpen);
    };
  }, []);

  async function fetchPayments() {
    try {
      setLoading(true);

      const res = await fetch("/api/pagamentos?status=ATRASADO&pageSize=50", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Falha ao carregar pagamentos atrasados.");
      }

      const data: PagamentosResponse = await res.json();

      setPayments(
        (data.data ?? []).map((payment) => ({
          id: payment.id,
          student: payment.matricula.aluno.nome,
          amount: Number(payment.valor),
          competenciaMes: payment.competenciaMes,
          competenciaAno: payment.competenciaAno,
          competence: formatCompetence(
            payment.competenciaMes,
            payment.competenciaAno
          ),
        }))
      );
    } catch (error) {
      console.error(error);
      setErrorMessage("Erro ao carregar pagamentos.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const competenceOptions = useMemo(() => {
    const map = new Map();

    payments.forEach((p) => {
      const value = `${p.competenciaMes}-${p.competenciaAno}`;
      if (!map.has(value)) {
        map.set(value, {
          value,
          label: p.competence,
        });
      }
    });

    return Array.from(map.values());
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchSearch = p.student
        .toLowerCase()
        .includes(search.toLowerCase());

      const compValue = `${p.competenciaMes}-${p.competenciaAno}`;
      const matchComp =
        selectedCompetence === "all" || selectedCompetence === compValue;

      return matchSearch && matchComp;
    });
  }, [payments, search, selectedCompetence]);

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredPayments.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPayments.map((p) => p.id));
    }
  }

  async function handleChargeAll() {
    try {
      setChargingAll(true);
      setSuccessMessage("");
      setErrorMessage("");
  
      const ids =
        selectedIds.length > 0
          ? selectedIds
          : filteredPayments.map((p) => p.id);
  
      const response = await fetch("/api/cobrancas/enviar-todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIds: ids,
        }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result?.error || "Erro ao cobrar alunos.");
      }
  
      setSuccessMessage(result.message || `Cobrança enviada para ${ids.length} aluno(s).`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cobrar alunos."
      );
    } finally {
      setChargingAll(false);
    }
  }

  async function handleChargeOne(paymentId: string, studentName: string) {
    try {
      setChargingId(paymentId);
      setSuccessMessage("");
      setErrorMessage("");
  
      const response = await fetch("/api/cobrancas/enviar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId }),
      });
  
      const result = await response.json();
  
      if (!response.ok) {
        throw new Error(result?.error || "Erro ao cobrar aluno.");
      }
  
      setSuccessMessage(`Cobrança enviada para ${studentName}.`);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao cobrar aluno."
      );
    } finally {
      setChargingId(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[640px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Cobrar alunos atrasados</DialogTitle>
          <DialogDescription>
            Selecione alunos ou cobre todos rapidamente.
          </DialogDescription>
        </DialogHeader>

        {/* filtros + botão */}
        <div className="mt-2 flex items-center gap-2">
          <Input
            placeholder="Buscar aluno..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 rounded-xl flex-1"
          />

          <select
            value={selectedCompetence}
            onChange={(e) => setSelectedCompetence(e.target.value)}
            className="h-10 rounded-xl border border-border px-3 text-sm"
          >
            <option value="all">Todos</option>
            {competenceOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <Button
            size="sm"
            className="h-10 rounded-xl whitespace-nowrap"
            onClick={handleChargeAll}
            disabled={chargingAll}
          >
            {chargingAll
              ? "Cobrando..."
              : selectedIds.length > 0
              ? `Cobrar (${selectedIds.length})`
              : `Cobrar (${filteredPayments.length})`}
          </Button>
        </div>

        {/* contador */}
        <div className="mt-2 text-xs text-muted-foreground">
          {filteredPayments.length} aluno(s)
        </div>

        {/* feedback */}
        {successMessage && (
          <div className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {/* lista */}
        <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-2">
          {/* select all */}
          {filteredPayments.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={
                  selectedIds.length === filteredPayments.length &&
                  filteredPayments.length > 0
                }
                onChange={toggleSelectAll}
              />
              Selecionar todos
            </div>
          )}

          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            filteredPayments.map((p) => (
              <div
                key={p.id}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition ${
                  selectedIds.includes(p.id)
                    ? "border-black bg-black/[0.03] dark:border-white/20 dark:bg-white/[0.03]"
                    : "border-border"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSelect(p.id)}
                  className="flex flex-1 items-center gap-3 text-left"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4"
                  />

                  <div>
                    <p className="text-sm font-medium">{p.student}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(p.amount)} • {p.competence}
                    </p>
                  </div>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleChargeOne(p.id, p.student);
                  }}
                  disabled={chargingId === p.id}
                >
                  {chargingId === p.id ? "..." : "Enviar cobrança"}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
