"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@/components/ui/textarea";

interface NewEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading?: boolean;
  mode?: "create" | "edit";
  initialStart?: string;
  initialEnd?: string;
  initialData?: {
    titulo?: string;
    descricao?: string;
    tipo?: "GERAL" | "REUNIAO" | "PROVA" | "REPOSICAO" | "FERIADO" | "LEMBRETE";
    dataInicio?: string;
    dataFim?: string;
    local?: string;
  } | null;
  onSubmit: (payload: {
    titulo: string;
    descricao?: string;
    tipo: "GERAL" | "REUNIAO" | "PROVA" | "REPOSICAO" | "FERIADO" | "LEMBRETE";
    dataInicio: string;
    dataFim: string;
    diaInteiro?: boolean;
    local?: string;
  }) => Promise<void>;
}

export function NewEventModal({
  open,
  onOpenChange,
  loading = false,
  mode = "create",
  initialStart,
  initialEnd,
  initialData = null,
  onSubmit,
}: NewEventModalProps) {
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    titulo: "",
    descricao: "",
    tipo: "GERAL" as
      | "GERAL"
      | "REUNIAO"
      | "PROVA"
      | "REPOSICAO"
      | "FERIADO"
      | "LEMBRETE",
    dataInicio: "",
    dataFim: "",
    local: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        titulo: initialData?.titulo ?? "",
        descricao: initialData?.descricao ?? "",
        tipo: initialData?.tipo ?? "GERAL",
        dataInicio: initialData?.dataInicio ?? initialStart ?? "",
        dataFim: initialData?.dataFim ?? initialEnd ?? "",
        local: initialData?.local ?? "",
      });
      setError("");
    }
  }, [open, initialData, initialStart, initialEnd]);

  function resetForm() {
    setForm({
      titulo: "",
      descricao: "",
      tipo: "GERAL",
      dataInicio: "",
      dataFim: "",
      local: "",
    });
    setError("");
  }

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (!form.titulo.trim()) {
      setError("Título é obrigatório.");
      return;
    }

    if (!form.dataInicio || !form.dataFim) {
      setError("Preencha início e fim do evento.");
      return;
    }

    if (new Date(form.dataFim) <= new Date(form.dataInicio)) {
      setError("A data/hora final deve ser maior que a inicial.");
      return;
    }

    try {
      await onSubmit({
        titulo: form.titulo.trim(),
        descricao: form.descricao.trim() || undefined,
        tipo: form.tipo,
        dataInicio: form.dataInicio,
        dataFim: form.dataFim,
        local: form.local.trim() || undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível salvar o evento.";
      setError(message);
    }
  }

  const title = mode === "edit" ? "Editar evento" : "Novo evento";
  const description =
    mode === "edit"
      ? "Atualize os dados do evento."
      : "Cadastre um evento manual no calendário.";
  const submitLabel = mode === "edit" ? "Salvar alterações" : "Criar evento";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              placeholder="Ex: Reunião pedagógica"
              value={form.titulo}
              onChange={(e) => updateField("titulo", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={form.tipo}
                onValueChange={(value) =>
                  updateField(
                    "tipo",
                    value as
                      | "GERAL"
                      | "REUNIAO"
                      | "PROVA"
                      | "REPOSICAO"
                      | "FERIADO"
                      | "LEMBRETE"
                  )
                }
              >
                <SelectTrigger id="tipo">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GERAL">Geral</SelectItem>
                  <SelectItem value="REUNIAO">Reunião</SelectItem>
                  <SelectItem value="PROVA">Prova</SelectItem>
                  <SelectItem value="REPOSICAO">Reposição</SelectItem>
                  <SelectItem value="FERIADO">Feriado</SelectItem>
                  <SelectItem value="LEMBRETE">Lembrete</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="local">Local</Label>
              <Input
                id="local"
                placeholder="Ex: Sala 02"
                value={form.local}
                onChange={(e) => updateField("local", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="inicio">Início</Label>
              <Input
                id="inicio"
                type="datetime-local"
                value={form.dataInicio}
                onChange={(e) => updateField("dataInicio", e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="fim">Fim</Label>
              <Input
                id="fim"
                type="datetime-local"
                value={form.dataFim}
                onChange={(e) => updateField("dataFim", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              rows={4}
              placeholder="Detalhes do evento..."
              className="resize-none"
              value={form.descricao}
              onChange={(e) => updateField("descricao", e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>

            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}