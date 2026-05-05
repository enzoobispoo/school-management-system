"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { StudentFormData } from "@/hooks/alunos/use-student-modal";

type StringField = keyof {
  [K in keyof StudentFormData as StudentFormData[K] extends string ? K : never]: string;
};

interface StudentFormProps {
  form: StudentFormData;
  error: string;
  errorField?: string;
  errorTab?: "dados" | "responsavel" | "saude" | "extras";
  loading?: boolean;
  mode?: "create" | "edit";
  submitLabel: string;
  updateField: (field: StringField, value: string) => void;
  updateBoolField: (field: "possuiLaudo" | "adaptacaoNecessaria", value: boolean) => void;
  formatCpf: (value: string) => string;
  formatPhone: (value: string) => string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
}

const tabs = [
  { id: "dados", label: "Dados" },
  { id: "responsavel", label: "Responsável" },
  { id: "saude", label: "Saúde" },
  { id: "extras", label: "Extras" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const statusOptions = [
  { value: "ATIVO", label: "Ativo" },
  { value: "INATIVO", label: "Inativo" },
  { value: "TRANCADO", label: "Trancado" },
  { value: "ARQUIVADO", label: "Arquivado" },
];

const laudoTipos = [
  "TEA (Transtorno do Espectro Autista)",
  "TDAH",
  "Deficiência Intelectual",
  "Deficiência Visual",
  "Deficiência Auditiva",
  "Deficiência Física",
  "Deficiência Múltipla",
  "Altas Habilidades / Superdotação",
  "Dislexia",
  "Discalculia",
  "Transtorno de Ansiedade",
  "Outro",
];

const laudoNiveis = [
  { value: "leve", label: "Leve — suporte pontual" },
  { value: "moderado", label: "Moderado — suporte regular" },
  { value: "intenso", label: "Intenso — suporte contínuo" },
];

function Textarea({ id, placeholder, value, onChange, rows = 2 }: {
  id: string; placeholder: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; rows?: number;
}) {
  return (
    <textarea
      id={id}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      className="w-full resize-none rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
    />
  );
}

export function StudentForm({
  form, error, errorField, errorTab, loading = false, mode = "create", submitLabel,
  updateField, updateBoolField, formatCpf, formatPhone, onCancel, onSubmit,
}: StudentFormProps) {
  const [activeTab, setActiveTab] = useState<TabId>(errorTab ?? "dados");

  useEffect(() => {
    if (errorTab) setActiveTab(errorTab);
  }, [errorTab]);

  function hasError(field: string) {
    return errorField === field;
  }

  return (
    <form className="grid gap-4 py-2" onSubmit={onSubmit}>
      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl border border-border bg-muted/30 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
              errorTab === tab.id && activeTab !== tab.id
                ? "text-destructive"
                : ""
            )}
          >
            {tab.label}
            {errorTab === tab.id && activeTab !== tab.id && (
              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-destructive align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Aba: Dados */}
      {activeTab === "dados" && (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" placeholder="Ex: Maria Silva Santos" value={form.nome}
              onChange={(e) => updateField("nome", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="email@exemplo.com" value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={hasError("email") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input id="cpf" placeholder="000.000.000-00" value={form.cpf}
                onChange={(e) => updateField("cpf", formatCpf(e.target.value))}
                className={hasError("cpf") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" placeholder="(00) 00000-0000" value={form.telefone}
                onChange={(e) => updateField("telefone", formatPhone(e.target.value))} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="dataNascimento">Data de Nascimento</Label>
              <Input id="dataNascimento" type="date" value={form.dataNascimento}
                onChange={(e) => updateField("dataNascimento", e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="endereco">Endereço</Label>
            <Input id="endereco" placeholder="Rua, número - Bairro, Cidade - UF" value={form.endereco}
              onChange={(e) => updateField("endereco", e.target.value)} />
          </div>
        </div>
      )}

      {/* Aba: Responsável */}
      {activeTab === "responsavel" && (
        <div className="grid gap-4">
          <p className="text-xs text-muted-foreground">
            Dados para cobrança e contato, especialmente para alunos menores de idade.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="responsavelNome">Nome do responsável</Label>
            <Input id="responsavelNome" placeholder="Ex: Ana Souza" value={form.responsavelNome}
              onChange={(e) => updateField("responsavelNome", e.target.value)}
              className={hasError("responsavelNome") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="responsavelTelefone">Telefone</Label>
              <Input id="responsavelTelefone" placeholder="(00) 00000-0000" value={form.responsavelTelefone}
                onChange={(e) => updateField("responsavelTelefone", formatPhone(e.target.value))}
                className={hasError("responsavelTelefone") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsavelEmail">E-mail</Label>
              <Input id="responsavelEmail" type="email" placeholder="responsavel@exemplo.com"
                value={form.responsavelEmail}
                onChange={(e) => updateField("responsavelEmail", e.target.value)}
                className={hasError("responsavelEmail") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="responsavelCpf">CPF do responsável</Label>
            <Input id="responsavelCpf" placeholder="000.000.000-00" value={form.responsavelCpf}
              onChange={(e) => updateField("responsavelCpf", formatCpf(e.target.value))}
              className={hasError("responsavelCpf") ? "border-destructive focus-visible:ring-destructive/20" : ""} />
          </div>
        </div>
      )}

      {/* Aba: Saúde */}
      {activeTab === "saude" && (
        <div className="grid gap-5 max-h-[60vh] overflow-y-auto pr-1">

          {/* Laudo */}
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <label className="flex cursor-pointer items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Laudo / Diagnóstico</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Preencha se o aluno possui laudo médico ou diagnóstico formal.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <input type="checkbox" checked={form.possuiLaudo}
                  onChange={(e) => updateBoolField("possuiLaudo", e.target.checked)}
                  className="h-4 w-4 rounded" />
                <span className="text-sm text-foreground">Possui laudo</span>
              </div>
            </label>

            {form.possuiLaudo && (
              <div className="grid gap-3">
                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="laudoTipo">Tipo / Diagnóstico</Label>
                    <select id="laudoTipo" value={form.laudoTipo}
                      onChange={(e) => updateField("laudoTipo", e.target.value)}
                      className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none">
                      <option value="">Selecione...</option>
                      {laudoTipos.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="laudoCid">CID-10</Label>
                    <Input id="laudoCid" placeholder="Ex: F84.0" value={form.laudoCid}
                      onChange={(e) => updateField("laudoCid", e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="laudoNivel">Nível de suporte necessário</Label>
                  <div className="flex gap-2">
                    {laudoNiveis.map((n) => (
                      <button key={n.value} type="button"
                        onClick={() => updateField("laudoNivel", n.value)}
                        className={cn(
                          "flex-1 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                          form.laudoNivel === n.value
                            ? "border-foreground bg-foreground text-background"
                            : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                        )}>
                        {n.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="laudoProfissional">Profissional emissor</Label>
                    <Input id="laudoProfissional" placeholder="Ex: Dr. João Silva" value={form.laudoProfissional}
                      onChange={(e) => updateField("laudoProfissional", e.target.value)} />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="laudoData">Data do laudo</Label>
                    <Input id="laudoData" type="date" value={form.laudoData}
                      onChange={(e) => updateField("laudoData", e.target.value)} />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="laudoDescricao">Descrição / Particularidades</Label>
                  <Textarea id="laudoDescricao"
                    placeholder="Descreva particularidades do diagnóstico relevantes para a escola..."
                    value={form.laudoDescricao}
                    onChange={(e) => updateField("laudoDescricao", e.target.value)} rows={2} />
                </div>
              </div>
            )}
          </div>

          {/* Adaptações */}
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <label className="flex cursor-pointer items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-foreground">Adaptações necessárias</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Adaptações pedagógicas ou de acessibilidade em sala.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pt-0.5">
                <input type="checkbox" checked={form.adaptacaoNecessaria}
                  onChange={(e) => updateBoolField("adaptacaoNecessaria", e.target.checked)}
                  className="h-4 w-4 rounded" />
                <span className="text-sm text-foreground">Necessita</span>
              </div>
            </label>
            {form.adaptacaoNecessaria && (
              <div className="grid gap-1.5">
                <Label htmlFor="adaptacaoDescricao">Descreva as adaptações</Label>
                <Textarea id="adaptacaoDescricao"
                  placeholder="Ex: prova ampliada, tempo extra, intérprete de libras, assento preferencial..."
                  value={form.adaptacaoDescricao}
                  onChange={(e) => updateField("adaptacaoDescricao", e.target.value)} rows={2} />
              </div>
            )}
          </div>

          {/* Saúde geral */}
          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">Saúde geral</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="alergias">Alergias</Label>
                <Textarea id="alergias" placeholder="Ex: amendoim, penicilina, látex..."
                  value={form.alergias} onChange={(e) => updateField("alergias", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="condicoesCronicas">Condições crônicas</Label>
                <Textarea id="condicoesCronicas" placeholder="Ex: diabetes tipo 1, asma, epilepsia..."
                  value={form.condicoesCronicas} onChange={(e) => updateField("condicoesCronicas", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="medicamentos">Medicamentos em uso</Label>
              <Textarea id="medicamentos" placeholder="Ex: Ritalina 10mg às 8h, insulina conforme necessidade..."
                value={form.medicamentos} onChange={(e) => updateField("medicamentos", e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="planoSaude">Plano de saúde</Label>
                <Input id="planoSaude" placeholder="Ex: Unimed, Bradesco Saúde..." value={form.planoSaude}
                  onChange={(e) => updateField("planoSaude", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="contatoEmergenciaNome">Contato de emergência</Label>
                <Input id="contatoEmergenciaNome" placeholder="Nome" value={form.contatoEmergenciaNome}
                  onChange={(e) => updateField("contatoEmergenciaNome", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="contatoEmergenciaTelefone">Telefone de emergência</Label>
              <Input id="contatoEmergenciaTelefone" placeholder="(00) 00000-0000"
                value={form.contatoEmergenciaTelefone}
                onChange={(e) => updateField("contatoEmergenciaTelefone", formatPhone(e.target.value))} />
            </div>
          </div>

          {/* Observações */}
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="tratamentos">Tratamentos em andamento</Label>
              <Textarea id="tratamentos"
                placeholder="Ex: acompanhamento psicológico semanal, fonoaudiologia 2x/semana, psicopedagogia..."
                value={form.tratamentos}
                onChange={(e) => updateField("tratamentos", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="observacoesMedicas">Observações médicas gerais</Label>
              <Textarea id="observacoesMedicas"
                placeholder="Outras informações médicas relevantes..."
                value={form.observacoesMedicas}
                onChange={(e) => updateField("observacoesMedicas", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="observacoesProf">Observações para o professor</Label>
              <Textarea id="observacoesProf"
                placeholder="Informações que o professor deve saber sobre este aluno..."
                value={form.observacoesProf}
                onChange={(e) => updateField("observacoesProf", e.target.value)} />
            </div>
          </div>

        </div>
      )}

      {/* Aba: Extras */}
      {activeTab === "extras" && (
        <div className="grid gap-4 max-h-[60vh] overflow-y-auto pr-1">

          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">Status do aluno</p>
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((s) => (
                <button key={s.value} type="button"
                  onClick={() => updateField("status", s.value)}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                    form.status === s.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
            {(form.status === "INATIVO" || form.status === "TRANCADO" || form.status === "ARQUIVADO") && (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="dataSaida">Data de saída</Label>
                  <Input id="dataSaida" type="date" value={form.dataSaida}
                    onChange={(e) => updateField("dataSaida", e.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="motivoSaida">Motivo</Label>
                  <Input id="motivoSaida" placeholder="Ex: Mudou de cidade" value={form.motivoSaida}
                    onChange={(e) => updateField("motivoSaida", e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-semibold text-foreground">Informações pedagógicas</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="nivelInicial">Nível inicial</Label>
                <Input id="nivelInicial" placeholder="Ex: Iniciante, A1, B2..." value={form.nivelInicial}
                  onChange={(e) => updateField("nivelInicial", e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="idiomaNativo">Idioma nativo</Label>
                <Input id="idiomaNativo" placeholder="Ex: Português, Espanhol..." value={form.idiomaNativo}
                  onChange={(e) => updateField("idiomaNativo", e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="indicacao">Como nos conheceu / Indicação</Label>
              <Input id="indicacao" placeholder="Ex: Indicado por fulano, Google, Instagram..." value={form.indicacao}
                onChange={(e) => updateField("indicacao", e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="observacoesGerais">Observações gerais</Label>
              <Textarea id="observacoesGerais"
                placeholder="Qualquer informação adicional relevante sobre o aluno..."
                value={form.observacoesGerais}
                onChange={(e) => updateField("observacoesGerais", e.target.value)} rows={3} />
            </div>
          </div>

        </div>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <DialogFooter>
        <Button variant="outline" type="button" onClick={onCancel} disabled={loading} className="rounded-2xl">
          Cancelar
        </Button>
        <Button type="submit" disabled={loading} className="rounded-2xl">
          {loading ? (mode === "edit" ? "Salvando..." : "Cadastrando...") : submitLabel}
        </Button>
      </DialogFooter>
    </form>
  );
}
