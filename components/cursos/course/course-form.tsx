"use client";

import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
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

const categories = ["Idiomas", "Música", "Tecnologia", "Educação"];

interface CourseFormProps {
  form: {
    nome: string;
    categoria: string;
    duracaoTexto: string;
    valorMensal: string;
    descricao: string;
  };
  error: string;
  loading?: boolean;
  mode?: "create" | "edit";
  submitLabel: string;
  updateField: (
    field: "nome" | "categoria" | "duracaoTexto" | "valorMensal" | "descricao",
    value: string
  ) => void;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

export function CourseForm({
  form,
  error,
  loading = false,
  mode = "create",
  submitLabel,
  updateField,
  onCancel,
  onSubmit,
}: CourseFormProps) {
  return (
    <form className="grid gap-4 py-4" onSubmit={onSubmit}>
      <div className="grid gap-2">
        <Label htmlFor="courseName">Nome do curso</Label>
        <Input
          id="courseName"
          placeholder="Ex: Inglês Avançado"
          value={form.nome}
          onChange={(e) => updateField("nome", e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={form.categoria}
            onValueChange={(value) => updateField("categoria", value)}
          >
            <SelectTrigger className="rounded-2xl">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="duration">Duração</Label>
          <Input
            id="duration"
            placeholder="Ex: 6 meses"
            value={form.duracaoTexto}
            onChange={(e) => updateField("duracaoTexto", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="price">Valor mensal (R$)</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          placeholder="0,00"
          value={form.valorMensal}
          onChange={(e) => updateField("valorMensal", e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          placeholder="Breve descrição do curso..."
          className="resize-none"
          rows={3}
          value={form.descricao}
          onChange={(e) => updateField("descricao", e.target.value)}
        />
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
              : "Criando..."
            : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}