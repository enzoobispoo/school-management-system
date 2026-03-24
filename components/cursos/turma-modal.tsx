"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface ProfessorOption {
  id: string
  nome: string
}

interface TurmaModalProps {
  open: boolean
  onClose: () => void
  cursoId: string
  onSuccess?: () => Promise<void> | void
}

interface ProfessoresResponse {
  data: Array<{
    id: string
    nome: string
  }>
}

interface HorarioFormItem {
  id: string
  diaSemana: string
  horaInicio: string
  horaFim: string
}

function createHorario(): HorarioFormItem {
  return {
    id: crypto.randomUUID(),
    diaSemana: "",
    horaInicio: "",
    horaFim: "",
  }
}

export function TurmaModal({
  open,
  onClose,
  cursoId,
  onSuccess,
}: TurmaModalProps) {
  const [professores, setProfessores] = useState<ProfessorOption[]>([])
  const [loadingProfessores, setLoadingProfessores] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [form, setForm] = useState({
    nome: "",
    professorId: "",
    capacidadeMaxima: "20",
  })

  const [horarios, setHorarios] = useState<HorarioFormItem[]>([createHorario()])

  function updateField(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateHorario(
    horarioId: string,
    field: "diaSemana" | "horaInicio" | "horaFim",
    value: string
  ) {
    setHorarios((prev) =>
      prev.map((item) =>
        item.id === horarioId ? { ...item, [field]: value } : item
      )
    )
  }

  function addHorario() {
    setHorarios((prev) => [...prev, createHorario()])
  }

  function removeHorario(horarioId: string) {
    setHorarios((prev) => prev.filter((item) => item.id !== horarioId))
  }

  function resetForm() {
    setForm({
      nome: "",
      professorId: "",
      capacidadeMaxima: "20",
    })

    setHorarios([createHorario()])
    setError("")
  }

  async function fetchProfessores() {
    try {
      setLoadingProfessores(true)

      const response = await fetch("/api/professores?page=1&pageSize=100", {
        cache: "no-store",
      })

      if (!response.ok) {
        throw new Error("Erro ao buscar professores")
      }

      const result: ProfessoresResponse = await response.json()

      setProfessores(
        result.data.map((prof) => ({
          id: prof.id,
          nome: prof.nome,
        }))
      )
    } catch (err) {
      console.error(err)
      setError("Não foi possível carregar os professores.")
    } finally {
      setLoadingProfessores(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchProfessores()
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")

    if (!form.nome.trim()) {
      setError("Nome da turma é obrigatório.")
      return
    }

    if (!form.professorId) {
      setError("Professor é obrigatório.")
      return
    }

    if (!form.capacidadeMaxima.trim()) {
      setError("Capacidade máxima é obrigatória.")
      return
    }

    const capacidade = Number(form.capacidadeMaxima)

    if (Number.isNaN(capacidade) || capacidade <= 0) {
      setError("Informe uma capacidade máxima válida.")
      return
    }

    const horariosValidos = horarios
      .filter((h) => h.diaSemana && h.horaInicio && h.horaFim)
      .map(({ diaSemana, horaInicio, horaFim }) => ({
        diaSemana,
        horaInicio,
        horaFim,
      }))

    if (horariosValidos.length === 0) {
      setError("Adicione pelo menos um horário válido.")
      return
    }

    try {
      setSubmitting(true)

      const response = await fetch("/api/turmas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cursoId,
          professorId: form.professorId,
          nome: form.nome.trim(),
          capacidadeMaxima: capacidade,
          ativo: true,
          horarios: horariosValidos,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erro ao criar turma")
      }

      resetForm()
      onClose()
      await onSuccess?.()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível criar a turma."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onClose()
          resetForm()
        }
      }}
    >
      <DialogContent className="sm:max-w-[520px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Nova Turma</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma turma neste curso.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4 py-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome da turma</Label>
            <Input
              id="nome"
              placeholder="Ex: Turma A - Manhã"
              value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Professor</Label>
              <Select
                value={form.professorId}
                onValueChange={(value) => updateField("professorId", value)}
                disabled={loadingProfessores}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue
                    placeholder={
                      loadingProfessores
                        ? "Carregando..."
                        : "Selecione um professor"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {professores.map((professor) => (
                    <SelectItem key={professor.id} value={professor.id}>
                      {professor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="capacidade">Capacidade máxima</Label>
              <Input
                id="capacidade"
                type="number"
                min={1}
                value={form.capacidadeMaxima}
                onChange={(e) => updateField("capacidadeMaxima", e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <Label>Horários da turma</Label>
              <Button type="button" variant="outline" size="sm" onClick={addHorario}>
                Adicionar outro dia
              </Button>
            </div>

            {horarios.map((horario) => (
              <div key={horario.id} className="grid grid-cols-4 items-end gap-3">
                <div className="grid gap-2">
                  <Label>Dia</Label>
                  <Select
                    value={horario.diaSemana}
                    onValueChange={(value) =>
                      updateHorario(horario.id, "diaSemana", value)
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Dia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEGUNDA">Segunda</SelectItem>
                      <SelectItem value="TERCA">Terça</SelectItem>
                      <SelectItem value="QUARTA">Quarta</SelectItem>
                      <SelectItem value="QUINTA">Quinta</SelectItem>
                      <SelectItem value="SEXTA">Sexta</SelectItem>
                      <SelectItem value="SABADO">Sábado</SelectItem>
                      <SelectItem value="DOMINGO">Domingo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Início</Label>
                  <Input
                    type="time"
                    value={horario.horaInicio}
                    onChange={(e) =>
                      updateHorario(horario.id, "horaInicio", e.target.value)
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Fim</Label>
                  <Input
                    type="time"
                    value={horario.horaFim}
                    onChange={(e) =>
                      updateHorario(horario.id, "horaFim", e.target.value)
                    }
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => removeHorario(horario.id)}
                  disabled={horarios.length === 1}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onClose()
                resetForm()
              }}
              disabled={submitting}
              className="rounded-2xl"
            >
              Cancelar
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="rounded-2xl bg-black text-white hover:bg-black/90"
            >
              {submitting ? "Criando..." : "Criar Turma"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}