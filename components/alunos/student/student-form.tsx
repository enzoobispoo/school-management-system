"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StudentFormProps {
  form: {
    nome: string;
    email: string;
    cpf: string;
    telefone: string;
    dataNascimento: string;
    endereco: string;
    responsavelNome: string;
    responsavelTelefone: string;
    responsavelEmail: string;
  };
  error: string;
  loading?: boolean;
  mode?: "create" | "edit";
  submitLabel: string;
  updateField: (
    field:
      | "nome"
      | "email"
      | "cpf"
      | "telefone"
      | "dataNascimento"
      | "endereco"
      | "responsavelNome"
      | "responsavelTelefone"
      | "responsavelEmail",
    value: string
  ) => void;
  formatCpf: (value: string) => string;
  formatPhone: (value: string) => string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function StudentForm({
  form,
  error,
  loading = false,
  mode = "create",
  submitLabel,
  updateField,
  formatCpf,
  formatPhone,
  onCancel,
  onSubmit,
}: StudentFormProps) {
  return (
    <form className="grid gap-4 py-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          placeholder="Ex: Maria Silva Santos"
          value={form.nome}
          onChange={(e) => updateField("nome", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="email@exemplo.com"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            placeholder="000.000.000-00"
            value={form.cpf}
            onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            placeholder="(00) 00000-0000"
            value={form.telefone}
            onChange={(e) => updateField("telefone", formatPhone(e.target.value))}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="birthDate">Data de Nascimento</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.dataNascimento}
            onChange={(e) => updateField("dataNascimento", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="address">Endereço</Label>
        <Input
          id="address"
          placeholder="Rua, número - Bairro, Cidade - UF"
          value={form.endereco}
          onChange={(e) => updateField("endereco", e.target.value)}
        />
      </div>

      <div className="mt-2 grid gap-4 rounded-2xl border border-border/60 p-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Responsável</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Use esses dados para cobrança e contato, especialmente em caso de aluno menor de idade.
          </p>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="guardianName">Nome do responsável</Label>
          <Input
            id="guardianName"
            placeholder="Ex: Ana Souza"
            value={form.responsavelNome}
            onChange={(e) => updateField("responsavelNome", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="guardianPhone">Telefone do responsável</Label>
            <Input
              id="guardianPhone"
              placeholder="(00) 00000-0000"
              value={form.responsavelTelefone}
              onChange={(e) =>
                updateField("responsavelTelefone", formatPhone(e.target.value))
              }
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="guardianEmail">E-mail do responsável</Label>
            <Input
              id="guardianEmail"
              type="email"
              placeholder="responsavel@exemplo.com"
              value={form.responsavelEmail}
              onChange={(e) => updateField("responsavelEmail", e.target.value)}
            />
          </div>
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