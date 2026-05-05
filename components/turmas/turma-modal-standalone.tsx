"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface HorarioFormItem {
  id: string;
  diaSemana: string;
  horaInicio: string;
  horaFim: string;
}

function createHorario(): HorarioFormItem {
  return { id: crypto.randomUUID(), diaSemana: "", horaInicio: "", horaFim: "" };
}

interface Props {
  onSuccess?: () => void;
}

export function TurmaModalStandalone({ onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [cursos, setCursos] = useState<{ id: string; nome: string }[]>([]);
  const [professores, setProfessores] = useState<{ id: string; nome: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ cursoId: "", professorId: "", nome: "", capacidadeMaxima: "20" });
  const [horarios, setHorarios] = useState<HorarioFormItem[]>([createHorario()]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateHorario(id: string, field: "diaSemana" | "horaInicio" | "horaFim", value: string) {
    setHorarios((prev) => prev.map((h) => h.id === id ? { ...h, [field]: value } : h));
  }

  function reset() {
    setForm({ cursoId: "", professorId: "", nome: "", capacidadeMaxima: "20" });
    setHorarios([createHorario()]);
    setError("");
  }

  useEffect(() => {
    if (!open) return;
    fetch("/api/cursos?pageSize=100", { cache: "no-store" })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d.data)) setCursos(d.data); });
    fetch("/api/professores?pageSize=100", { cache: "no-store" })
      .then((r) => r.json()).then((d) => { if (Array.isArray(d.data)) setProfessores(d.data); });
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.cursoId) { setError("Selecione um curso."); return; }
    if (!form.nome.trim()) { setError("Nome da turma é obrigatório."); return; }
    if (!form.professorId) { setError("Professor é obrigatório."); return; }
    const capacidade = Number(form.capacidadeMaxima);
    if (!capacidade || capacidade <= 0) { setError("Capacidade inválida."); return; }
    const horariosValidos = horarios
      .filter((h) => h.diaSemana && h.horaInicio && h.horaFim)
      .map(({ diaSemana, horaInicio, horaFim }) => ({ diaSemana, horaInicio, horaFim }));
    if (horariosValidos.length === 0) { setError("Adicione pelo menos um horário válido."); return; }

    try {
      setSubmitting(true);
      const res = await fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cursoId: form.cursoId, professorId: form.professorId, nome: form.nome.trim(), capacidadeMaxima: capacidade, ativo: true, horarios: horariosValidos }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao criar turma");
      reset();
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar turma");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button className="gap-2 rounded-2xl h-11 px-5 bg-black text-white dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20 border border-black/10 dark:border-white/10 shadow-sm">
          <Plus className="h-4 w-4" />
          Nova Turma
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[520px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Nova Turma</DialogTitle>
          <DialogDescription>Preencha os dados para criar uma nova turma.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label>Curso</Label>
            <Select value={form.cursoId} onValueChange={(v) => updateField("cursoId", v)}>
              <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecione o curso" /></SelectTrigger>
              <SelectContent>
                {cursos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="nome">Nome da turma</Label>
            <Input id="nome" placeholder="Ex: Turma A - Manhã" value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Professor</Label>
              <Select value={form.professorId} onValueChange={(v) => updateField("professorId", v)}>
                <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {professores.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cap">Capacidade máxima</Label>
              <Input id="cap" type="number" min={1} value={form.capacidadeMaxima}
                onChange={(e) => updateField("capacidadeMaxima", e.target.value)} />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Horários</Label>
              <Button type="button" variant="outline" size="sm"
                onClick={() => setHorarios((prev) => [...prev, createHorario()])}>
                + Adicionar dia
              </Button>
            </div>
            {horarios.map((h) => (
              <div key={h.id} className="grid grid-cols-4 items-end gap-3">
                <div className="grid gap-2">
                  <Label>Dia</Label>
                  <Select value={h.diaSemana} onValueChange={(v) => updateHorario(h.id, "diaSemana", v)}>
                    <SelectTrigger className="rounded-2xl"><SelectValue placeholder="Dia" /></SelectTrigger>
                    <SelectContent>
                      {["SEGUNDA","TERCA","QUARTA","QUINTA","SEXTA","SABADO","DOMINGO"].map((d) => (
                        <SelectItem key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase().replace("terca","terça").replace("sabado","sábado")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Início</Label>
                  <Input type="time" value={h.horaInicio} onChange={(e) => updateHorario(h.id, "horaInicio", e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Fim</Label>
                  <Input type="time" value={h.horaFim} onChange={(e) => updateHorario(h.id, "horaFim", e.target.value)} />
                </div>
                <Button type="button" variant="outline" onClick={() => setHorarios((prev) => prev.filter((x) => x.id !== h.id))}
                  disabled={horarios.length === 1}>
                  Remover
                </Button>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => { setOpen(false); reset(); }}
              disabled={submitting} className="rounded-2xl">Cancelar</Button>
            <Button type="submit" disabled={submitting} className="rounded-md">
              {submitting ? "Criando..." : "Criar Turma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
