"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TeacherFormProps {
  form: {
    nome: string;
    email: string;
    telefone: string;
  };
  error: string;
  loading?: boolean;
  mode?: "create" | "edit";
  submitLabel: string;
  updateField: (
    field: "nome" | "email" | "telefone",
    value: string
  ) => void;
  formatPhone: (value: string) => string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function TeacherForm({
  form,
  error,
  loading = false,
  mode = "create",
  submitLabel,
  updateField,
  formatPhone,
  onCancel,
  onSubmit,
}: TeacherFormProps) {
  return (
    <form className="grid gap-4 py-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="teacherName">Nome completo</Label>
        <Input
          id="teacherName"
          placeholder="Ex: Maria Silva Santos"
          value={form.nome}
          onChange={(e) => updateField("nome", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="teacherEmail">E-mail</Label>
          <Input
            id="teacherEmail"
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="teacherPhone">Telefone</Label>
          <Input
            id="teacherPhone"
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) =>
              updateField("telefone", formatPhone(e.target.value))
            }
          />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-2xl"
        >
          Cancelar
        </Button>

        <Button type="submit" disabled={loading} className="rounded-2xl">
          {loading
            ? mode === "edit"
              ? "Salvando..."
              : "Cadastrando..."
            : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}