"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Camera, FileText, History, HeartPulse,
  Mail, Phone, Pencil, UserCircle, Ban, PauseCircle, Printer
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StudentModal } from "@/components/alunos/student-modal";
import { StudentDocuments } from "@/components/alunos/table/student-documents";
import { useRef } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";

// ─── tipos ────────────────────────────────────────────────────────────────────

type Pagamento = {
  id: string; descricao: string; valor: number; status: string;
  vencimento: string; dataPagamento: string | null;
  competenciaMes: number; competenciaAno: number; metodoPagamento: string | null;
};

type Matricula = {
  id: string; status: string; dataMatricula: string;
  dataCancelamento: string | null; motivoCancelamento: string | null; observacoes: string | null;
  turma: { id: string; nome: string; ativo: boolean; curso: { nome: string; valorMensal: number }; professor: { nome: string } };
  pagamentos: Pagamento[];
};

type Aluno = {
  id: string; nome: string; email: string | null; telefone: string | null;
  cpf: string | null; dataNascimento: Date | null; endereco: string | null;
  status: string; fotoUrl: string | null; observacoesGerais: string | null;
  indicacao: string | null; nivelInicial: string | null; idiomaNativo: string | null;
  responsavelNome: string | null; responsavelTelefone: string | null;
  responsavelEmail: string | null; responsavelCpf: string | null;
  possuiLaudo: boolean; laudoTipo: string | null; laudoCid: string | null;
  laudoNivel: string | null; laudoProfissional: string | null;
  laudoData: Date | null; laudoDescricao: string | null;
  alergias: string | null; medicamentos: string | null;
  condicoesCronicas: string | null; planoSaude: string | null;
  contatoEmergenciaNome: string | null; contatoEmergenciaTelefone: string | null;
  adaptacaoNecessaria: boolean; adaptacaoDescricao: string | null;
  observacoesMedicas: string | null; observacoesProf: string | null; tratamentos: string | null;
  matriculas: Matricula[];
  documentos: Array<{ id: string; nome: string; tipo: string; url: string; tamanho: number | null; createdAt: Date }>;
  statusHistorico: Array<{ id: string; statusDe: string; statusPara: string; motivo: string | null; createdAt: Date }>;
  situacaoResumo?: {
    mediaGeral: number | null;
    frequenciaGeral: number | null;
    faltas: number;
    totalNotas: number;
    advertencias: number;
    possuiObservacoes: boolean;
    risco?: "ok" | "atencao";
  };
};

type AlunoRegistro = {
  id: string;
  tipo: "OCORRENCIA" | "ADVERTENCIA" | "OBSERVACAO";
  titulo: string;
  descricao: string | null;
  gravidade: string | null;
  createdAt: string;
};

// ─── helpers ──────────────────────────────────────────────────────────────────

const statusAlunoLabel: Record<string, string> = { ATIVO: "Ativo", INATIVO: "Inativo", TRANCADO: "Trancado", ARQUIVADO: "Arquivado" };
const statusAlunoVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ATIVO: "default", INATIVO: "secondary", TRANCADO: "outline", ARQUIVADO: "destructive",
};
const statusMatriculaLabel: Record<string, string> = { ATIVA: "Ativa", TRANCADA: "Trancada", CANCELADA: "Cancelada", CONCLUIDA: "Concluída" };
const statusMatriculaVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ATIVA: "default", TRANCADA: "secondary", CANCELADA: "destructive", CONCLUIDA: "outline",
};
const statusPagamentoColor: Record<string, string> = {
  PAGO: "text-green-600 dark:text-green-400",
  PENDENTE: "text-amber-600 dark:text-amber-400",
  ATRASADO: "text-red-600 dark:text-red-400",
  CANCELADO: "text-muted-foreground",
};
const statusPagamentoLabel: Record<string, string> = { PAGO: "Pago", PENDENTE: "Pendente", ATRASADO: "Atrasado", CANCELADO: "Cancelado" };

function fmt(v: number) { return `R$ ${v.toFixed(2).replace(".", ",")}`; }
function fmtDate(d: string | Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}
function fmtPhone(v: string | null) {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  if (d.length > 0) return d;
  return null;
}
function fmtCpf(v: string | null) {
  if (!v) return null;
  const d = v.replace(/\D/g, "");
  if (d.length === 11) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
  if (d.length > 0) return d;
  return null;
}

// ─── sub-componentes ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="text-sm">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function AlunoPhoto({ alunoId, initialUrl, onRefresh }: { alunoId: string; initialUrl?: string | null; onRefresh?: () => void }) {
  const [url, setUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("alunoId", alunoId);
      const res = await fetch("/api/alunos/foto", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) { setUrl(data.fotoUrl); onRefresh?.(); }
      else toast.error(data.error || "Erro ao enviar foto");
    } finally { setUploading(false); }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flexShrink: 0 }}>
      <div
        onClick={() => fileRef.current?.click()}
        style={{
          position: "relative",
          width: 80,
          height: 80,
          minWidth: 80,
          minHeight: 80,
          borderRadius: "50%",
          overflow: "hidden",
          cursor: "pointer",
          border: "2px solid var(--border)",
          background: "var(--muted)",
          flexShrink: 0,
        }}
      >
        {url ? (
          <img src={url} alt="Foto" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center" }}>
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.3)" }}>
            <span className="text-[10px] text-white">...</span>
          </div>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
      >
        {url ? "Alterar foto" : "Adicionar foto"}
      </button>
    </div>
  );
}

function CancelMatriculaModal({
  matricula, open, onOpenChange, onSuccess,
}: {
  matricula: Matricula | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSuccess: (id: string, novoStatus: string) => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [acao, setAcao] = useState<"CANCELADA" | "TRANCADA">("CANCELADA");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!matricula) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/matriculas/${matricula.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: acao,
          motivoCancelamento: motivo || null,
          ...(acao === "CANCELADA" ? { dataCancelamento: new Date().toISOString() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao atualizar matrícula"); return; }
      toast.success(acao === "CANCELADA" ? "Matrícula cancelada" : "Matrícula trancada");
      onSuccess(matricula.id, acao);
      onOpenChange(false);
      setMotivo("");
    } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>Cancelar ou trancar matrícula</DialogTitle>
          <DialogDescription>
            {matricula ? `Turma: ${matricula.turma.nome} · ${matricula.turma.curso.nome}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={() => setAcao("CANCELADA")}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm transition-colors ${
                acao === "CANCELADA"
                  ? "border-destructive/50 bg-destructive/5 text-destructive"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <Ban className="mb-1 mx-auto h-4 w-4" />
              Cancelar
              <p className="text-[10px] mt-0.5 opacity-70">Permanente</p>
            </button>
            <button
              onClick={() => setAcao("TRANCADA")}
              className={`flex-1 rounded-xl border px-3 py-3 text-sm transition-colors ${
                acao === "TRANCADA"
                  ? "border-amber-500/50 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                  : "border-border text-muted-foreground hover:border-border/80"
              }`}
            >
              <PauseCircle className="mb-1 mx-auto h-4 w-4" />
              Trancar
              <p className="text-[10px] mt-0.5 opacity-70">Reversível</p>
            </button>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Descreva o motivo..."
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30 resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            className={`rounded-2xl ${
              acao === "CANCELADA" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""
            }`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Salvando..." : acao === "CANCELADA" ? "Cancelar matrícula" : "Trancar matrícula"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── componente principal ─────────────────────────────────────────────────────

function ReativarMatriculaButton({ matriculaId, onSuccess }: { matriculaId: string; onSuccess: (id: string) => void }) {
  const [loading, setLoading] = useState(false);

  async function handleReativar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/matriculas/${matriculaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ATIVA" }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao reativar matrícula"); return; }
      toast.success("Matrícula reativada com sucesso");
      onSuccess(matriculaId);
    } finally { setLoading(false); }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-xl h-7 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/20"
      onClick={handleReativar}
      disabled={loading}
    >
      {loading ? "..." : "Reativar"}
    </Button>
  );
}

export function AlunoProfileContent({ aluno: initial }: { aluno: Aluno }) {
  type ProfileTab = "geral" | "boletim" | "ocorrencias" | "saude";
  type RegistroFiltroTipo = "TODOS" | "OCORRENCIA" | "ADVERTENCIA" | "OBSERVACAO";
  type RegistroFiltroGravidade = "TODAS" | "BAIXA" | "MEDIA" | "ALTA";
  const router = useRouter();
  const [aluno, setAluno] = useState(initial);
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [cancelMatricula, setCancelMatricula] = useState<Matricula | null>(null);
  const [activeTab, setActiveTab] = useState<ProfileTab>("geral");
  const [boletim, setBoletim] = useState<any>(null);
  const [registros, setRegistros] = useState<AlunoRegistro[]>([]);
  const [registroTipo, setRegistroTipo] = useState<"OCORRENCIA" | "ADVERTENCIA" | "OBSERVACAO">("OBSERVACAO");
  const [registroTitulo, setRegistroTitulo] = useState("");
  const [registroDescricao, setRegistroDescricao] = useState("");
  const [registroGravidade, setRegistroGravidade] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<RegistroFiltroTipo>("TODOS");
  const [filtroGravidade, setFiltroGravidade] = useState<RegistroFiltroGravidade>("TODAS");

  async function handleEdit(payload: Record<string, unknown>) {
    setEditLoading(true);
    try {
      const res = await fetch(`/api/alunos/${aluno.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao atualizar aluno"); return; }
      toast.success("Aluno atualizado com sucesso");
      setAluno((prev) => ({ ...prev, ...data }));
      setEditOpen(false);
      router.refresh();
    } finally { setEditLoading(false); }
  }

  function handleMatriculaUpdated(id: string, novoStatus: string) {
    setAluno((prev) => ({
      ...prev,
      matriculas: prev.matriculas.map((m) =>
        m.id === id ? { ...m, status: novoStatus } : m
      ),
    }));
  }

  const h = aluno;
  const hasHealth = h.possuiLaudo || h.adaptacaoNecessaria || h.alergias || h.medicamentos || h.condicoesCronicas || h.observacoesMedicas;

  useEffect(() => {
    const activeMatricula = aluno.matriculas.find((m) => m.status === "ATIVA") || aluno.matriculas[0];
    if (!activeMatricula) return;
    fetch(`/api/academico/matriculas/${activeMatricula.id}/boletim`, { cache: "no-store" })
      .then((r) => r.json().then((j) => (r.ok ? j : null)))
      .then((j) => setBoletim(j))
      .catch(() => undefined);

    fetch(`/api/alunos/${aluno.id}/registros`, { cache: "no-store" })
      .then((r) => r.json().then((j) => (r.ok ? j : [])))
      .then((j) => setRegistros(Array.isArray(j) ? j : []))
      .catch(() => undefined);
  }, [aluno.id, aluno.matriculas]);

  async function addRegistro() {
    if (!registroTitulo.trim()) {
      toast.error("Informe um título para o registro.");
      return;
    }
    const res = await fetch(`/api/alunos/${aluno.id}/registros`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: registroTipo,
        titulo: registroTitulo.trim(),
        descricao: registroDescricao.trim() || null,
        gravidade: registroGravidade.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data?.error || "Não foi possível salvar o registro.");
      return;
    }
    toast.success("Registro salvo.");
    setRegistroTitulo("");
    setRegistroDescricao("");
    setRegistroGravidade("");
    setRegistros((prev) => [data, ...prev]);
  }

  const resumoRegistros = registros.reduce(
    (acc, r) => {
      if (r.tipo === "OCORRENCIA") acc.ocorrencias += 1;
      if (r.tipo === "ADVERTENCIA") acc.advertencias += 1;
      if (r.tipo === "OBSERVACAO") acc.observacoes += 1;
      const g = (r.gravidade || "").trim().toUpperCase();
      if (g === "BAIXA") acc.baixa += 1;
      if (g === "MEDIA" || g === "MÉDIA") acc.media += 1;
      if (g === "ALTA") acc.alta += 1;
      return acc;
    },
    { ocorrencias: 0, advertencias: 0, observacoes: 0, baixa: 0, media: 0, alta: 0 }
  );

  const registrosFiltrados = registros.filter((r) => {
    const okTipo = filtroTipo === "TODOS" ? true : r.tipo === filtroTipo;
    const gravidadeNormalizada = (r.gravidade || "").trim().toUpperCase();
    const okGravidade =
      filtroGravidade === "TODAS"
        ? true
        : filtroGravidade === "MEDIA"
          ? gravidadeNormalizada === "MEDIA" || gravidadeNormalizada === "MÉDIA"
          : gravidadeNormalizada === filtroGravidade;
    return okTipo && okGravidade;
  });

  return (
    <div className="mx-auto w-full max-w-6xl p-6 space-y-5">
      <Link href="/alunos" className="inline-flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Voltar para alunos
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-border/70 bg-card/80 px-6 py-6">
        <div className="flex items-start gap-5">
          <AlunoPhoto alunoId={aluno.id} initialUrl={aluno.fotoUrl} onRefresh={() => router.refresh()} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground leading-tight">{aluno.nome}</h2>
              <Badge variant={statusAlunoVariant[aluno.status] ?? "outline"} className="rounded-full">
                {statusAlunoLabel[aluno.status] ?? aluno.status}
              </Badge>
            </div>
            <div className="flex flex-col gap-1.5 mt-1.5 text-sm text-muted-foreground">
              {aluno.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{aluno.email}</span>}
              {aluno.telefone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{fmtPhone(aluno.telefone)}</span>}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
              {aluno.dataNascimento && <span>Nasc. {fmtDate(aluno.dataNascimento)}</span>}
              {aluno.cpf && <span>CPF {fmtCpf(aluno.cpf)}</span>}
            </div>
            {aluno.endereco && <p className="mt-1 text-sm text-muted-foreground">{aluno.endereco}</p>}
          </div>
            <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 print:hidden border-border/70 bg-background/70" onClick={() => window.print()}>
              <Printer className="h-3.5 w-3.5" />
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5 print:hidden border-border/70 bg-background/70" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      <Card className="rounded-2xl border-border/70 bg-card/80">
        <CardHeader className="text-base font-semibold">
          Situação geral para atendimento
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Média geral</p>
            <p className="text-lg font-semibold">
              {aluno.situacaoResumo?.mediaGeral !== null &&
              aluno.situacaoResumo?.mediaGeral !== undefined
                ? aluno.situacaoResumo.mediaGeral.toFixed(2)
                : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Frequência geral</p>
            <p className="text-lg font-semibold">
              {aluno.situacaoResumo?.frequenciaGeral !== null &&
              aluno.situacaoResumo?.frequenciaGeral !== undefined
                ? `${aluno.situacaoResumo.frequenciaGeral.toFixed(1)}%`
                : "-"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Classificação</p>
            <p
              className={`text-lg font-semibold ${
                !aluno.situacaoResumo?.risco
                  ? "text-muted-foreground"
                  : aluno.situacaoResumo.risco === "atencao"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {!aluno.situacaoResumo?.risco
                ? "-"
                : aluno.situacaoResumo.risco === "atencao"
                  ? "Precisa atenção"
                  : "Estável"}
            </p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Faltas</p>
            <p className="text-lg font-semibold">{aluno.situacaoResumo?.faltas ?? 0}</p>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground">Registros avaliativos</p>
            <p className="text-lg font-semibold">{aluno.situacaoResumo?.totalNotas ?? 0}</p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-2xl border border-border/70 bg-card/80 p-2">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { id: "geral", label: "Informações gerais" },
            { id: "boletim", label: "Boletim" },
            { id: "ocorrencias", label: "Ocorrências" },
            { id: "saude", label: "Saúde" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ProfileTab)}
              className={`rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "border border-border bg-muted text-foreground"
                  : "border border-transparent text-muted-foreground hover:border-border/60 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <Card className={`rounded-[24px] border-border/50 shadow-sm ${activeTab === "boletim" ? "" : "hidden"}`}>
        <CardHeader className="text-base font-semibold">
          Boletim e situação pedagógica
        </CardHeader>
        <CardContent className="space-y-2">
          {!boletim ? (
            <p className="text-sm text-muted-foreground">Boletim indisponível no momento.</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">
                {boletim.turma?.nome ?? "Turma atual"}
              </p>
              {(boletim.disciplinas || []).map((d: any) => (
                <div key={d.disciplinaId} className="rounded-lg border border-border/70 bg-muted/20 p-2">
                  <p className="text-sm font-medium">{d.disciplinaNome}</p>
                  <p className="text-xs text-muted-foreground">
                    Média: {d.media !== null ? Number(d.media).toFixed(2) : "-"} | Frequência:{" "}
                    {d.frequencia !== null ? `${Number(d.frequencia).toFixed(1)}%` : "-"}
                  </p>
                </div>
              ))}
            </>
          )}
        </CardContent>
      </Card>

      <Card className={`rounded-[24px] border-border/50 shadow-sm ${activeTab === "ocorrencias" ? "" : "hidden"}`}>
        <CardHeader className="text-base font-semibold">
          Ocorrências, advertências e observações
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Ocorrências</p>
              <p className="text-lg font-semibold">{resumoRegistros.ocorrencias}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Advertências</p>
              <p className="text-lg font-semibold">{resumoRegistros.advertencias}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Observações</p>
              <p className="text-lg font-semibold">{resumoRegistros.observacoes}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Gravidade alta</p>
              <p className="text-lg font-semibold">{resumoRegistros.alta}</p>
            </div>
          </div>

          <div className="grid gap-2 md:grid-cols-4">
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              value={registroTipo}
              onChange={(e) => setRegistroTipo(e.target.value as any)}
            >
              <option value="OBSERVACAO">Observação</option>
              <option value="OCORRENCIA">Ocorrência</option>
              <option value="ADVERTENCIA">Advertência</option>
            </select>
            <input
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm md:col-span-2"
              placeholder="Título"
              value={registroTitulo}
              onChange={(e) => setRegistroTitulo(e.target.value)}
            />
            <input
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              placeholder="Gravidade (opcional)"
              value={registroGravidade}
              onChange={(e) => setRegistroGravidade(e.target.value)}
            />
          </div>
          <textarea
            className="min-h-24 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
            placeholder="Descrição do registro..."
            value={registroDescricao}
            onChange={(e) => setRegistroDescricao(e.target.value)}
          />
          <div className="flex justify-end">
            <Button className="rounded-xl" onClick={addRegistro}>
              Salvar registro
            </Button>
          </div>

          <div className="grid gap-2 md:grid-cols-2">
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as RegistroFiltroTipo)}
            >
              <option value="TODOS">Todos os tipos</option>
              <option value="OCORRENCIA">Somente ocorrências</option>
              <option value="ADVERTENCIA">Somente advertências</option>
              <option value="OBSERVACAO">Somente observações</option>
            </select>
            <select
              className="h-10 rounded-xl border border-input bg-background px-3 text-sm"
              value={filtroGravidade}
              onChange={(e) => setFiltroGravidade(e.target.value as RegistroFiltroGravidade)}
            >
              <option value="TODAS">Todas as gravidades</option>
              <option value="BAIXA">Baixa</option>
              <option value="MEDIA">Média</option>
              <option value="ALTA">Alta</option>
            </select>
          </div>

          <div className="space-y-2">
            {registrosFiltrados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem registros.</p>
            ) : (
              registrosFiltrados.map((r) => (
                <div key={r.id} className="rounded-lg border border-border/70 bg-muted/20 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{r.titulo}</p>
                    <Badge variant="outline" className="rounded-full text-[10px]">
                      {r.tipo}
                    </Badge>
                  </div>
                  {r.descricao ? <p className="mt-1 text-sm text-muted-foreground">{r.descricao}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {r.gravidade ? `${r.gravidade} · ` : ""}
                    {fmtDate(r.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <div className={activeTab === "geral" ? "space-y-5" : "hidden"}>
      {/* Responsável */}
      {(aluno.responsavelNome || aluno.responsavelTelefone || aluno.responsavelEmail || aluno.responsavelCpf) && (
        <Card className="rounded-2xl border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold pb-3">
            <UserCircle className="h-4 w-4 text-muted-foreground" />
            Responsável
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow label="Nome" value={aluno.responsavelNome} />
            <InfoRow label="Telefone" value={fmtPhone(aluno.responsavelTelefone)} />
            <InfoRow label="E-mail" value={aluno.responsavelEmail} />
            <InfoRow label="CPF" value={fmtCpf(aluno.responsavelCpf)} />
          </CardContent>
        </Card>
      )}

      {/* Matrículas */}
      <Card className="rounded-2xl border-border/70 bg-card/80">
        <CardHeader className="text-base font-semibold">
          Matrículas ({aluno.matriculas.length})
        </CardHeader>
        <CardContent className="space-y-3">
          {aluno.matriculas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma matrícula encontrada.</p>
          ) : (
            aluno.matriculas.map((m) => (
              <div key={m.id} className="rounded-xl border border-border/70 bg-background/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{m.turma.curso.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {m.turma.nome} · Prof. {m.turma.professor.nome}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Desde {fmtDate(m.dataMatricula)}
                      {m.dataCancelamento ? ` · Encerrada em ${fmtDate(m.dataCancelamento)}` : ""}
                    </p>
                    {m.motivoCancelamento && (
                      <p className="text-xs text-muted-foreground">Motivo: {m.motivoCancelamento}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusMatriculaVariant[m.status] ?? "outline"} className="rounded-full">
                      {statusMatriculaLabel[m.status] ?? m.status}
                    </Badge>
                    {m.status === "ATIVA" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl h-7 px-2 text-xs"
                        onClick={() => setCancelMatricula(m)}
                      >
                        Cancelar / Trancar
                      </Button>
                    )}
                    {m.status === "TRANCADA" && (
                      <ReativarMatriculaButton
                        matriculaId={m.id}
                        onSuccess={(id) => handleMatriculaUpdated(id, "ATIVA")}
                      />
                    )}
                  </div>
                </div>

                {/* Pagamentos */}
                {m.pagamentos.length > 0 && (
                  <div className="mt-3 space-y-1.5 border-t border-border/50 pt-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pagamentos</p>
                      <p className="text-[11px] text-muted-foreground">{m.pagamentos.length} registro(s)</p>
                    </div>
                    {m.pagamentos.map((p) => (
                      <div key={p.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{p.descricao}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{fmt(p.valor)}</span>
                          <span className={`text-xs font-medium ${statusPagamentoColor[p.status] ?? ""}`}>
                            {statusPagamentoLabel[p.status] ?? p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Histórico de turmas */}
      {aluno.matriculas.length > 1 && (
        <Card className="rounded-2xl border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4 text-muted-foreground" />
            Histórico de turmas
          </CardHeader>
          <CardContent>
            <div className="relative space-y-0">
              {[...aluno.matriculas].reverse().map((m, i, arr) => (
                <div key={m.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full border-2 ${
                      m.status === "ATIVA" ? "border-green-500 bg-green-500" :
                      m.status === "TRANCADA" ? "border-amber-500 bg-amber-500" :
                      m.status === "CANCELADA" ? "border-destructive bg-destructive" :
                      "border-border bg-muted"
                    }`} />
                    {i < arr.length - 1 && <div className="w-px flex-1 bg-border/50 my-1" />}
                  </div>
                  <div className="pb-4 min-w-0">
                    <p className="text-sm font-medium text-foreground">{m.turma.curso.nome} · {m.turma.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(m.dataMatricula)}
                      {m.dataCancelamento ? ` → ${fmtDate(m.dataCancelamento)}` : m.status === "ATIVA" ? " → atual" : ""}
                      {m.motivoCancelamento ? ` · ${m.motivoCancelamento}` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Documentos */}
      <Card className="rounded-2xl border-border/70 bg-card/80">
        <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
          <FileText className="h-4 w-4 text-muted-foreground" />
          Documentos
        </CardHeader>
        <CardContent>
          <StudentDocuments alunoId={aluno.id} />
        </CardContent>
      </Card>
      </div>

      {/* Seções colapsáveis */}
      <div className={`flex flex-wrap gap-2 ${activeTab === "geral" ? "" : "hidden"}`}>
        {(aluno.observacoesGerais || aluno.indicacao || aluno.nivelInicial || aluno.idiomaNativo) && (
          <div className="rounded-xl border border-border/50 bg-card px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Informações adicionais</p>
            <div className="space-y-0.5">
              <InfoRow label="Observações" value={aluno.observacoesGerais} />
              <InfoRow label="Indicação" value={aluno.indicacao} />
              <InfoRow label="Nível inicial" value={aluno.nivelInicial} />
              <InfoRow label="Idioma nativo" value={aluno.idiomaNativo} />
            </div>
          </div>
        )}
      </div>

      {/* Saúde */}
      {activeTab === "saude" && hasHealth && (
        <Card className="rounded-2xl border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <HeartPulse className="h-4 w-4 text-muted-foreground" />
            Saúde
          </CardHeader>
          <CardContent className="space-y-3">
            {aluno.possuiLaudo && (
              <div className="rounded-xl border border-border/70 bg-background/60 p-3 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laudo</p>
                <InfoRow label="Tipo" value={aluno.laudoTipo} />
                <InfoRow label="CID" value={aluno.laudoCid} />
                <InfoRow label="Nível" value={aluno.laudoNivel} />
                <InfoRow label="Profissional" value={aluno.laudoProfissional} />
                <InfoRow label="Data" value={fmtDate(aluno.laudoData)} />
                <InfoRow label="Descrição" value={aluno.laudoDescricao} />
              </div>
            )}
            {aluno.adaptacaoNecessaria && (
              <div className="rounded-xl border border-border/70 bg-background/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Adaptações</p>
                <p className="text-sm text-foreground">{aluno.adaptacaoDescricao || "Necessita de adaptações."}</p>
              </div>
            )}
            <div className="space-y-1">
              <InfoRow label="Alergias" value={aluno.alergias} />
              <InfoRow label="Medicamentos" value={aluno.medicamentos} />
              <InfoRow label="Condições crônicas" value={aluno.condicoesCronicas} />
              <InfoRow label="Plano de saúde" value={aluno.planoSaude} />
              <InfoRow label="Tratamentos" value={aluno.tratamentos} />
              <InfoRow label="Obs. médicas" value={aluno.observacoesMedicas} />
              <InfoRow label="Obs. para professor" value={aluno.observacoesProf} />
              {aluno.contatoEmergenciaNome && (
                <InfoRow label="Emergência" value={`${aluno.contatoEmergenciaNome}${aluno.contatoEmergenciaTelefone ? ` · ${aluno.contatoEmergenciaTelefone}` : ""}`} />
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Histórico de status */}
      {activeTab === "geral" && aluno.statusHistorico.length > 0 && (
        <Card className="rounded-2xl border-border/70 bg-card/80">
          <CardHeader className="flex flex-row items-center gap-2 text-base font-semibold">
            <History className="h-4 w-4 text-muted-foreground" />
            Histórico de status
          </CardHeader>
          <CardContent className="space-y-1.5">
            {aluno.statusHistorico.map((h) => (
              <div key={h.id} className="flex items-start justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2 text-sm">
                <div>
                  <span className="text-muted-foreground">{statusAlunoLabel[h.statusDe] ?? h.statusDe}</span>
                  <span className="mx-1.5 text-muted-foreground">→</span>
                  <span className="font-medium text-foreground">{statusAlunoLabel[h.statusPara] ?? h.statusPara}</span>
                  {h.motivo && <span className="ml-2 text-muted-foreground">· {h.motivo}</span>}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(h.createdAt)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Modal editar aluno */}
      <StudentModal
        open={editOpen}
        onOpenChange={setEditOpen}
        hideTrigger
        mode="edit"
        initialData={{
          nome: aluno.nome, email: aluno.email ?? "", telefone: aluno.telefone ?? "",
          cpf: aluno.cpf ?? "", endereco: aluno.endereco ?? "",
          status: aluno.status as any,
          responsavelNome: aluno.responsavelNome ?? "",
          responsavelTelefone: aluno.responsavelTelefone ?? "",
          responsavelEmail: aluno.responsavelEmail ?? "",
          responsavelCpf: aluno.responsavelCpf ?? "",
        }}
        onSubmit={handleEdit}
        loading={editLoading}
      />

      {/* Modal cancelar/trancar matrícula */}
      <CancelMatriculaModal
        matricula={cancelMatricula}
        open={!!cancelMatricula}
        onOpenChange={(v) => { if (!v) setCancelMatricula(null); }}
        onSuccess={handleMatriculaUpdated}
      />
    </div>
  );
}
