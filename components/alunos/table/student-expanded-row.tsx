"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, ShieldAlert, HeartPulse, Camera, History, Info } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { StudentCpfField } from "@/components/alunos/table/student-cpf-field";
import { StudentFinancialHistory } from "@/components/alunos/table/student-financial-history";
import { StudentDocuments } from "@/components/alunos/table/student-documents";
import { cn } from "@/lib/utils";

const nivelLabel: Record<string, string> = {
  leve: "Leve",
  moderado: "Moderado",
  intenso: "Intenso",
};

const nivelColor: Record<string, string> = {
  leve: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  moderado: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800",
  intenso: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
};

const statusHistoricoLabel: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  TRANCADO: "Trancado",
  ARQUIVADO: "Arquivado",
};

interface StudentExpandedRowProps {
  student: {
    id: string;
    email: string;
    phone: string;
    cpf?: string;
    birthDate?: string;
    address?: string;
    courses: string[];
    fotoUrl?: string;
    observacoesGerais?: string;
    indicacao?: string;
    nivelInicial?: string;
    idiomaNativo?: string;
    guardianName?: string;
    guardianPhone?: string;
    guardianEmail?: string;
    guardianCpf?: string;
    health?: {
      possuiLaudo: boolean;
      laudoTipo?: string;
      laudoCid?: string;
      laudoNivel?: string;
      laudoProfissional?: string;
      laudoData?: string;
      laudoDescricao?: string;
      adaptacaoNecessaria: boolean;
      adaptacaoDescricao?: string;
      alergias?: string;
      medicamentos?: string;
      condicoesCronicas?: string;
      planoSaude?: string;
      contatoEmergenciaNome?: string;
      contatoEmergenciaTelefone?: string;
      observacoesMedicas?: string;
      observacoesProf?: string;
      tratamentos?: string;
    };
    financialHistory?: {
      id?: string;
      date: string;
      description: string;
      amount: number;
      status: "paid" | "pending" | "overdue";
    }[];
  };
  onRefresh?: () => void;
}

const statusMatriculaLabel: Record<string, string> = {
  ATIVA: "Ativa",
  TRANCADA: "Trancada",
  CANCELADA: "Cancelada",
  CONCLUIDA: "Concluída",
};

const statusMatriculaColor: Record<string, string> = {
  ATIVA: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800",
  TRANCADA: "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800",
  CANCELADA: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800",
  CONCLUIDA: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800",
};

function useMatriculas(alunoId: string) {
  const [matriculas, setMatriculas] = useState<Array<{
    id: string;
    status: string;
    dataMatricula: string;
    turma: { nome: string; curso: { nome: string } };
  }>>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch(`/api/alunos/${alunoId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (d.matriculas) setMatriculas(d.matriculas); })
      .finally(() => setLoaded(true));
  }, [alunoId]);

  return { matriculas, loaded };
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">{label}: </span>
      {value}
    </div>
  );
}

function StudentPhoto({ alunoId, initialUrl, onRefresh }: { alunoId: string; initialUrl?: string; onRefresh?: () => void }) {
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
      if (res.ok) {
        setUrl(data.fotoUrl);
        onRefresh?.();
      }
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove() {
    if (!confirm("Remover foto do aluno?")) return;
    await fetch("/api/alunos/foto", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alunoId }),
    });
    setUrl(undefined);
    onRefresh?.();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-full border-2 border-border bg-muted"
        onClick={() => fileRef.current?.click()}
        title="Clique para alterar a foto"
      >
        {url ? (
          <Image src={url} alt="Foto do aluno" fill className="object-cover" unoptimized sizes="80px" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Camera className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60">
            <span className="text-[10px] text-muted-foreground">...</span>
          </div>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="flex gap-1.5">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-foreground"
        >
          {url ? "Alterar" : "Adicionar foto"}
        </button>
        {url && (
          <button
            onClick={handleRemove}
            className="rounded-lg border border-border px-2 py-1 text-[10px] text-muted-foreground hover:border-destructive/50 hover:text-destructive"
          >
            Remover
          </button>
        )}
      </div>
    </div>
  );
}

function StatusHistorico({ alunoId }: { alunoId: string }) {
  const [historico, setHistorico] = useState<
    { id: string; statusDe: string; statusPara: string; motivo?: string; criadoPor?: string; createdAt: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/alunos/status-historico?alunoId=${alunoId}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setHistorico(d); })
      .finally(() => setLoading(false));
  }, [alunoId]);

  if (loading) return <p className="text-xs text-muted-foreground">Carregando...</p>;
  if (historico.length === 0) return <p className="text-xs text-muted-foreground">Nenhuma alteração de status registrada.</p>;

  return (
    <div className="space-y-1.5">
      {historico.map((h) => (
        <div key={h.id} className="flex items-start gap-2 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs">
          <div className="flex-1">
            <span className="text-muted-foreground">{statusHistoricoLabel[h.statusDe] ?? h.statusDe}</span>
            <span className="mx-1.5 text-muted-foreground">→</span>
            <span className="font-medium text-foreground">{statusHistoricoLabel[h.statusPara] ?? h.statusPara}</span>
            {h.motivo && <span className="ml-2 text-muted-foreground">· {h.motivo}</span>}
          </div>
          <span className="shrink-0 text-muted-foreground">
            {new Date(h.createdAt).toLocaleDateString("pt-BR")}
          </span>
        </div>
      ))}
    </div>
  );
}

export function StudentExpandedRow({ student, onRefresh }: StudentExpandedRowProps) {
  const [showHealth, setShowHealth] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showExtras, setShowExtras] = useState(false);
  const { matriculas, loaded: matriculasLoaded } = useMatriculas(student.id);
  const h = student.health;

  const hasHealthData = h && (
    h.possuiLaudo || h.adaptacaoNecessaria ||
    h.alergias || h.medicamentos || h.condicoesCronicas ||
    h.tratamentos || h.observacoesMedicas || h.observacoesProf
  );

  const hasExtras = student.observacoesGerais || student.indicacao || student.nivelInicial || student.idiomaNativo;

  return (
    <TableRow className="border-border/50 bg-muted/20 hover:bg-transparent">
      <TableCell colSpan={10} className="p-0">
        <div className="animate-in fade-in-0 slide-in-from-top-1 border-t border-border/30 px-6 py-4 duration-200">

          {/* Layout principal */}
          <div className="grid gap-6 md:grid-cols-[auto_1fr_1fr_1fr]">

            {/* Foto */}
            <StudentPhoto alunoId={student.id} initialUrl={student.fotoUrl} onRefresh={onRefresh} />

            {/* Dados Pessoais */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <Link
                  href={`/alunos/${student.id}`}
                  className="text-sm font-medium text-foreground hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  Dados Pessoais →
                </Link>
              </div>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />{student.email}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />{student.phone}
                </div>
                {student.cpf ? <StudentCpfField cpf={student.cpf} /> : null}
                {student.birthDate ? <InfoRow label="Nascimento" value={student.birthDate} /> : null}
                {student.address ? <InfoRow label="Endereço" value={student.address} /> : null}

                {(student.guardianName || student.guardianPhone || student.guardianEmail || student.guardianCpf) && (
                  <div className="mt-2 rounded-xl border border-border/50 bg-background p-3">
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Responsável</p>
                    <div className="flex flex-col gap-1">
                      {student.guardianName && <span className="text-sm font-medium text-foreground">{student.guardianName}</span>}
                      {student.guardianCpf && <StudentCpfField cpf={student.guardianCpf} label="CPF" />}
                      {student.guardianPhone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{student.guardianPhone}
                        </div>
                      )}
                      {student.guardianEmail && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{student.guardianEmail}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Matrículas */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Matrículas</h4>
              <div className="flex flex-col gap-2">
                {!matriculasLoaded ? (
                  <p className="text-xs text-muted-foreground">Carregando...</p>
                ) : matriculas.length === 0 ? (
                  <div className="text-sm text-muted-foreground">Nenhuma matrícula encontrada.</div>
                ) : (
                  matriculas.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-md border border-border/50 bg-background p-2 gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.turma.curso.nome}</p>
                        <p className="text-xs text-muted-foreground">{m.turma.nome} · {new Date(m.dataMatricula).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <span className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusMatriculaColor[m.status] ?? ""}`}>
                        {statusMatriculaLabel[m.status] ?? m.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Histórico Financeiro */}
            <div>
              <h4 className="mb-3 text-sm font-medium text-foreground">Histórico Financeiro</h4>
              <StudentFinancialHistory items={student.financialHistory} />
            </div>

          </div>

          {/* Documentos */}
          <div className="mt-4 border-t border-border/30 pt-4 overflow-hidden">
            <StudentDocuments alunoId={student.id} />
          </div>

          {/* Seções colapsáveis */}
          <div className="mt-4 border-t border-border/30 pt-3 flex flex-wrap gap-2">

            {/* Campos extras */}
            {hasExtras && (
              <button
                onClick={() => setShowExtras((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                  showExtras
                    ? "border-border bg-muted text-foreground"
                    : "border-border/50 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <Info className="h-3.5 w-3.5" />
                {showExtras ? "Ocultar informações adicionais" : "Ver informações adicionais"}
              </button>
            )}

            {/* Histórico de status */}
            <button
              onClick={() => setShowStatus((v) => !v)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                showStatus
                  ? "border-border bg-muted text-foreground"
                  : "border-border/50 bg-background text-muted-foreground hover:border-border hover:text-foreground"
              )}
            >
              <History className="h-3.5 w-3.5" />
              {showStatus ? "Ocultar histórico de status" : "Ver histórico de status"}
            </button>

            {/* Saúde */}
            {hasHealthData && (
              <button
                onClick={() => setShowHealth((v) => !v)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
                  showHealth
                    ? "border-border bg-muted text-foreground"
                    : "border-border/50 bg-background text-muted-foreground hover:border-border hover:text-foreground"
                )}
              >
                <HeartPulse className="h-3.5 w-3.5" />
                {showHealth ? "Ocultar informações de saúde" : "Ver informações de saúde"}
                {!showHealth && (h?.possuiLaudo || h?.adaptacaoNecessaria) && (
                  <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-semibold text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                    {[h?.possuiLaudo && "Laudo", h?.adaptacaoNecessaria && "Adaptação"]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* Conteúdo: Extras */}
          {showExtras && hasExtras && (
            <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="rounded-xl border border-border/50 bg-background p-3 space-y-1">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informações adicionais</p>
                <InfoRow label="Observações gerais" value={student.observacoesGerais} />
                <InfoRow label="Indicação" value={student.indicacao} />
                <InfoRow label="Nível inicial" value={student.nivelInicial} />
                <InfoRow label="Idioma nativo" value={student.idiomaNativo} />
              </div>
            </div>
          )}

          {/* Conteúdo: Histórico de status */}
          {showStatus && (
            <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200">
              <div className="rounded-xl border border-border/50 bg-background p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico de status</p>
                <StatusHistorico alunoId={student.id} />
              </div>
            </div>
          )}

          {/* Conteúdo: Saúde */}
          {showHealth && (
            <div className="mt-3 animate-in fade-in-0 slide-in-from-top-1 duration-200 space-y-3">

              {h?.possuiLaudo && (
                <div className="rounded-xl border border-border/50 bg-background p-3">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Laudo / Diagnóstico</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    {h.laudoTipo && <span className="text-sm font-medium text-foreground break-words">{h.laudoTipo}</span>}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {h.laudoCid && (
                        <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-xs text-muted-foreground">
                          CID {h.laudoCid}
                        </span>
                      )}
                      {h.laudoNivel && (
                        <span className={`rounded-md border px-2 py-0.5 text-xs font-medium ${nivelColor[h.laudoNivel] ?? ""}`}>
                          {nivelLabel[h.laudoNivel] ?? h.laudoNivel}
                        </span>
                      )}
                    </div>
                    <InfoRow label="Emissor" value={h.laudoProfissional} />
                    <InfoRow label="Data" value={h.laudoData} />
                    <InfoRow label="Obs" value={h.laudoDescricao} />
                  </div>
                </div>
              )}

              {h?.adaptacaoNecessaria && (
                <div className="rounded-xl border border-border/50 bg-background p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Adaptações</p>
                  <p className="text-sm text-foreground break-words">{h.adaptacaoDescricao || "Necessita de adaptações."}</p>
                </div>
              )}

              {(h?.alergias || h?.condicoesCronicas || h?.medicamentos || h?.planoSaude || h?.tratamentos) && (
                <div className="rounded-xl border border-border/50 bg-background p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Saúde geral</p>
                  <div className="flex flex-col gap-1">
                    <InfoRow label="Alergias" value={h.alergias} />
                    <InfoRow label="Condições" value={h.condicoesCronicas} />
                    <InfoRow label="Medicamentos" value={h.medicamentos} />
                    <InfoRow label="Tratamentos" value={h.tratamentos} />
                    <InfoRow label="Plano" value={h.planoSaude} />
                  </div>
                </div>
              )}

              {(h?.observacoesMedicas || h?.observacoesProf || h?.contatoEmergenciaNome) && (
                <div className="rounded-xl border border-border/50 bg-background p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Observações</p>
                  <div className="flex flex-col gap-1">
                    <InfoRow label="Médicas" value={h.observacoesMedicas} />
                    <InfoRow label="Para o professor" value={h.observacoesProf} />
                    {h.contatoEmergenciaNome && (
                      <InfoRow label="Emergência" value={`${h.contatoEmergenciaNome}${h.contatoEmergenciaTelefone ? ` · ${h.contatoEmergenciaTelefone}` : ""}`} />
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </TableCell>
    </TableRow>
  );
}
