"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface Aluno {
  id: string;
  nome: string;
  email: string | null;
  status: string;
}

interface MatricularAlunoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  turmaId: string;
  turmaNome: string;
  onSuccess: () => void;
}

export function MatricularAlunoModal({
  open,
  onOpenChange,
  turmaId,
  turmaNome,
  onSuccess,
}: MatricularAlunoModalProps) {
  const { t } = useDashboardLanguage();
  const [search, setSearch] = useState("");
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [diaVencimentoMensal, setDiaVencimentoMensal] = useState(10);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setAlunos([]);
      return;
    }
    void (async () => {
      try {
        const res = await fetch("/api/settings/escola", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const d = Number(data.diaVencimentoPadrao ?? 10);
        if (d >= 1 && d <= 31) setDiaVencimentoMensal(d);
      } catch {
        /* default */
      }
    })();
  }, [open]);

  useEffect(() => {
    if (search.trim().length < 2) { setAlunos([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/alunos?search=${encodeURIComponent(search)}&pageSize=10`);
        const data = await res.json();
        setAlunos(data.data?.filter((a: Aluno) => a.status === "ATIVO") ?? []);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleMatricular(alunoId: string, alunoNome: string) {
    setSubmitting(alunoId);
    try {
      const res = await fetch("/api/matriculas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alunoId, turmaId, diaVencimentoMensal }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("turmas.enroll.error"));
        return;
      }
      toast.success(t("turmas.enroll.success", { name: alunoNome }));
      onSuccess();
      onOpenChange(false);
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{t("turmas.enroll.modalTitle")}</DialogTitle>
          <DialogDescription>
            {t("turmas.enroll.modalDescBefore")}{" "}
            <strong>{turmaNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid gap-2">
            <Label className="text-xs font-medium">{t("turmas.enroll.dueDayLabel")}</Label>
            <Select
              value={String(diaVencimentoMensal)}
              onValueChange={(v) => setDiaVencimentoMensal(Number(v))}
              disabled={Boolean(submitting)}
            >
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-[220px]">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {t("turmas.enroll.dayOption", { d })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground leading-snug">
              {t("turmas.enroll.dueDayHint")}
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("turmas.enroll.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-2xl pl-9"
              autoFocus
            />
          </div>

          <div className="max-h-[280px] overflow-y-auto space-y-1.5">
            {loading && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("turmas.enroll.searching")}
              </p>
            )}
            {!loading && search.trim().length >= 2 && alunos.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("turmas.enroll.noneFound")}
              </p>
            )}
            {!loading && search.trim().length < 2 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("turmas.enroll.typeTwoChars")}
              </p>
            )}
            {alunos.map((aluno) => (
              <div
                key={aluno.id}
                className="flex items-center justify-between rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{aluno.nome}</p>
                  {aluno.email && (
                    <p className="truncate text-xs text-muted-foreground">{aluno.email}</p>
                  )}
                </div>
                <Button
                  size="sm"
                  className="ml-3 shrink-0 rounded-xl h-8 px-3 text-xs"
                  disabled={submitting === aluno.id}
                  onClick={() => handleMatricular(aluno.id, aluno.nome)}
                >
                  {submitting === aluno.id ? "..." : t("turmas.enroll.enrollButton")}
                </Button>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
