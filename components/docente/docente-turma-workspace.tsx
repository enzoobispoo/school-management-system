"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  ClipboardList,
  Download,
  FileStack,
  Loader2,
  Megaphone,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  dashboardLocaleTag,
  useDashboardLanguage,
} from "@/lib/i18n/dashboard-language";

function todayIsoLocal() {
  const d = new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
}

type TurmaResumo = {
  turma: {
    id: string;
    nome: string;
    cursoNome: string;
    capacidadeMaxima: number;
    horarios: {
      diaLabel: string;
      horaInicio: string;
      horaFim: string;
    }[];
  };
  disciplinas: { id: string; nome: string }[];
  alunos: { matriculaId: string; alunoId: string; nome: string }[];
};

type AvaliacaoRow = {
  id: string;
  titulo: string;
  dataAvaliacao: string;
  disciplina: { id: string; nome: string };
  peso: number | null;
  notas: Array<{
    matriculaId: string;
    nota: number;
    observacao: string | null;
    matricula: { aluno: { nome: string } };
  }>;
};

type RegistroRow = {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string | null;
  gravidade: string | null;
  createdAt: string;
  aluno: { id: string; nome: string };
  professor: { id: string; nome: string } | null;
};

type MaterialRow = {
  id: string;
  titulo: string;
  tipo: string;
  arquivoUrl: string;
  arquivoNome: string;
  createdAt: string;
  disciplina: { nome: string } | null;
};

interface Props {
  turmaId: string;
}

export function DocenteTurmaWorkspace({ turmaId }: Props) {
  const { t, language } = useDashboardLanguage();

  const tipoMaterialLabel = useMemo(
    (): Record<string, string> => ({
      SLIDE: t("docente.workspace.material.slide"),
      ATIVIDADE_IMPRESSAO: t("docente.workspace.material.activityPrint"),
      PROVA_IMPRESSAO: t("docente.workspace.material.examPrint"),
      PLANO_AULA: t("docente.workspace.material.lessonPlan"),
      REFERENCIA: t("docente.workspace.material.reference"),
      OUTRO: t("docente.workspace.material.other"),
    }),
    [t]
  );

  const tipoRegistroLabel = useMemo(
    (): Record<string, string> => ({
      OBSERVACAO: t("docente.workspace.registro.observacao"),
      OCORRENCIA: t("docente.workspace.registro.ocorrencia"),
      ADVERTENCIA: t("docente.workspace.registro.advertencia"),
    }),
    [t]
  );

  const [resumo, setResumo] = useState<TurmaResumo | null>(null);
  const [aulasRecentes, setAulasRecentes] = useState<
    Array<{
      id: string;
      dataAula: string;
      titulo: string | null;
      conteudo: string | null;
      disciplina?: { nome: string };
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [dataAula, setDataAula] = useState(todayIsoLocal());
  const [tituloAula, setTituloAula] = useState("");
  const [conteudoAula, setConteudoAula] = useState("");
  const [presentes, setPresentes] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoRow[]>([]);
  const [loadingAv, setLoadingAv] = useState(false);
  const [novaAvDisciplina, setNovaAvDisciplina] = useState("");
  const [novaAvTitulo, setNovaAvTitulo] = useState("");
  const [novaAvData, setNovaAvData] = useState(todayIsoLocal());
  const [novaAvPeso, setNovaAvPeso] = useState("");
  const [notasDraft, setNotasDraft] = useState<Record<string, Record<string, string>>>({});

  const [registros, setRegistros] = useState<RegistroRow[]>([]);
  const [loadingReg, setLoadingReg] = useState(false);
  const [regAlunoId, setRegAlunoId] = useState("");
  const [regTipo, setRegTipo] = useState("OBSERVACAO");
  const [regTitulo, setRegTitulo] = useState("");
  const [regDesc, setRegDesc] = useState("");

  const [boletimMatriculaId, setBoletimMatriculaId] = useState("");
  const [boletimData, setBoletimData] = useState<{
    aluno: { nome: string };
    disciplinas: Array<{
      disciplinaNome: string;
      media: number | null;
      frequencia: number | null;
      faltas: number;
    }>;
  } | null>(null);
  const [loadingBol, setLoadingBol] = useState(false);

  const [materiaisTurma, setMateriaisTurma] = useState<MaterialRow[]>([]);

  const loadCore = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [rTurma, rChamadas] = await Promise.all([
        fetch(`/api/docente/turmas/${turmaId}`, { cache: "no-store" }),
        fetch(`/api/docente/turmas/${turmaId}/chamadas`, { cache: "no-store" }),
      ]);

      const jTurma = await rTurma.json();
      if (!rTurma.ok) {
        throw new Error(jTurma.error || t("docente.workspace.classNotFound"));
      }

      const jChamadas = rChamadas.ok ? await rChamadas.json() : [];

      setResumo(jTurma as TurmaResumo);
      setAulasRecentes(Array.isArray(jChamadas) ? jChamadas : []);

      const disc = (jTurma as TurmaResumo).disciplinas;
      setDisciplinaId(disc[0]?.id ?? "");
      setNovaAvDisciplina(disc[0]?.id ?? "");

      const pres: Record<string, boolean> = {};
      for (const a of (jTurma as TurmaResumo).alunos) {
        pres[a.matriculaId] = true;
      }
      setPresentes(pres);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("docente.loadError.generic"));
      setResumo(null);
    } finally {
      setLoading(false);
    }
  }, [turmaId, t]);

  const loadAvaliacoes = useCallback(async () => {
    try {
      setLoadingAv(true);
      const res = await fetch(`/api/docente/turmas/${turmaId}/avaliacoes`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.error || t("docente.workspace.loadAssessmentsError"));
      const rows = json as AvaliacaoRow[];
      setAvaliacoes(rows);
      const draft: Record<string, Record<string, string>> = {};
      const alunos = resumo?.alunos ?? [];
      for (const av of rows) {
        draft[av.id] = {};
        for (const alunoRow of alunos) {
          const exist = av.notas.find((n) => n.matriculaId === alunoRow.matriculaId);
          draft[av.id][alunoRow.matriculaId] = exist
            ? String(exist.nota)
            : "";
        }
      }
      setNotasDraft(draft);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
    } finally {
      setLoadingAv(false);
    }
  }, [turmaId, resumo, t]);

  const loadRegistros = useCallback(async () => {
    try {
      setLoadingReg(true);
      const res = await fetch(`/api/docente/turmas/${turmaId}/registros-aluno`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("common.errorShort"));
      setRegistros(json as RegistroRow[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
    } finally {
      setLoadingReg(false);
    }
  }, [turmaId, t]);

  const loadMateriaisTurma = useCallback(async () => {
    try {
      const res = await fetch(`/api/docente/materiais?turmaId=${turmaId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("common.errorShort"));
      setMateriaisTurma(json as MaterialRow[]);
    } catch {
      setMateriaisTurma([]);
    }
  }, [turmaId, t]);

  useEffect(() => {
    void loadCore();
  }, [loadCore]);

  useEffect(() => {
    if (!resumo) return;
    void loadAvaliacoes();
    void loadRegistros();
    void loadMateriaisTurma();
  }, [resumo, loadAvaliacoes, loadRegistros, loadMateriaisTurma]);

  useEffect(() => {
    if (!resumo?.alunos.length) return;
    setBoletimMatriculaId((prev) =>
      prev || resumo.alunos[0]?.matriculaId || ""
    );
    setRegAlunoId((prev) => prev || resumo.alunos[0]?.alunoId || "");
  }, [resumo]);

  const listaPresencas = useMemo(() => {
    if (!resumo) return [];
    return resumo.alunos.map((a) => ({
      matriculaId: a.matriculaId,
      presente: presentes[a.matriculaId] ?? false,
    }));
  }, [resumo, presentes]);

  async function handleRegistrarChamada(e: React.FormEvent) {
    e.preventDefault();
    if (
      !resumo ||
      !resumo.disciplinas.length ||
      !resumo.alunos.length ||
      !disciplinaId ||
      submitting
    )
      return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/docente/turmas/${turmaId}/chamadas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId,
          dataAula: new Date(`${dataAula}T12:00:00`).toISOString(),
          titulo: tituloAula.trim() || null,
          conteudo: conteudoAula.trim() || null,
          presencas: listaPresencas,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof j?.error === "string" ? j.error : t("docente.workspace.attendanceRegisterFail")
        );
      }
      toast.success(t("docente.workspace.attendanceSaved"));
      setTituloAula("");
      setConteudoAula("");
      await loadCore();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("docente.workspace.registerError"));
    } finally {
      setSubmitting(false);
    }
  }

  async function criarAvaliacao(e: React.FormEvent) {
    e.preventDefault();
    if (!novaAvTitulo.trim() || !novaAvDisciplina) {
      toast.error(t("docente.workspace.fillTitleDiscipline"));
      return;
    }
    try {
      const res = await fetch(`/api/docente/turmas/${turmaId}/avaliacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disciplinaId: novaAvDisciplina,
          titulo: novaAvTitulo.trim(),
          dataAvaliacao: new Date(`${novaAvData}T12:00:00`).toISOString(),
          peso: novaAvPeso.trim() ? Number(novaAvPeso) : null,
        }),
      });
      const j = await res.json();
      if (!res.ok)
        throw new Error(j.error || t("docente.workspace.createAssessmentError"));
      toast.success(t("docente.workspace.assessmentCreated"));
      setNovaAvTitulo("");
      await loadAvaliacoes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
    }
  }

  async function salvarNotas(avaliacaoId: string) {
    if (!resumo) return;
    const draft = notasDraft[avaliacaoId] || {};
    const parsed = resumo.alunos.map((a) => {
      const raw = String(draft[a.matriculaId] ?? "").trim();
      return {
        matriculaId: a.matriculaId,
        raw,
        nota: raw === "" ? NaN : Number(raw),
      };
    });
    if (parsed.some((p) => p.raw === "" || Number.isNaN(p.nota))) {
      toast.error(t("docente.workspace.numericGradeEach"));
      return;
    }
    const notas = parsed.map(({ matriculaId, nota }) => ({
      matriculaId,
      nota,
    }));
    try {
      const res = await fetch(
        `/api/docente/turmas/${turmaId}/avaliacoes/${avaliacaoId}/notas`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notas }),
        }
      );
      const j = await res.json();
      if (!res.ok)
        throw new Error(j.error || t("docente.workspace.saveGradesError"));
      toast.success(t("docente.workspace.gradesSaved"));
      await loadAvaliacoes();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
    }
  }

  async function registrarPedagogico(e: React.FormEvent) {
    e.preventDefault();
    if (!regAlunoId || !regTitulo.trim()) {
      toast.error(t("docente.workspace.studentTitleRequired"));
      return;
    }
    try {
      const res = await fetch(`/api/docente/turmas/${turmaId}/registros-aluno`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alunoId: regAlunoId,
          tipo: regTipo,
          titulo: regTitulo.trim(),
          descricao: regDesc.trim() || null,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || t("common.errorShort"));
      toast.success(t("docente.workspace.recordSaved"));
      setRegTitulo("");
      setRegDesc("");
      await loadRegistros();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
    }
  }

  async function carregarBoletim() {
    if (!boletimMatriculaId) return;
    try {
      setLoadingBol(true);
      const res = await fetch(
        `/api/docente/turmas/${turmaId}/matriculas/${boletimMatriculaId}/boletim`,
        { cache: "no-store" }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("common.errorShort"));
      setBoletimData({
        aluno: json.aluno,
        disciplinas: json.disciplinas,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.errorShort"));
      setBoletimData(null);
    } finally {
      setLoadingBol(false);
    }
  }

  function formatDataCurta(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(dashboardLocaleTag(language), {
        weekday: "short",
        day: "2-digit",
        month: "short",
      });
    } catch {
      return iso;
    }
  }

  const podeRegistrar =
    resumo &&
    resumo.disciplinas.length > 0 &&
    resumo.alunos.length > 0 &&
    disciplinaId;

  return (
    <DashboardLayout>
      <Header
        title={
          loading ?
            t("docente.workspace.headerFallbackTitle")
          : resumo?.turma.nome ?? t("docente.workspace.headerFallbackTitle")
        }
        description={
          loading ? t("common.loading") : resumo?.turma.cursoNome ?? ""
        }
      />

      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-6 pt-2">
          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("docente.workspace.backToDashboard")}
            </Link>
          </Button>

          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("docente.workspace.loadingClass")}
            </div>
          ) : null}

          {!loading && resumo ? (
            <Tabs defaultValue="visao" className="w-full space-y-6">
              <TabsList className="flex h-auto min-h-10 w-full flex-wrap justify-start gap-1 rounded-2xl bg-muted/40 p-1">
                <TabsTrigger value="visao" className="rounded-xl">
                  {t("docente.workspace.tabOverview")}
                </TabsTrigger>
                <TabsTrigger value="frequencia" className="rounded-xl">
                  {t("docente.workspace.tabAttendance")}
                </TabsTrigger>
                <TabsTrigger value="avaliacoes" className="rounded-xl">
                  {t("docente.workspace.tabAssessments")}
                </TabsTrigger>
                <TabsTrigger value="boletim" className="rounded-xl">
                  {t("docente.workspace.tabReportCard")}
                </TabsTrigger>
                <TabsTrigger value="registros" className="rounded-xl">
                  {t("docente.workspace.tabRecords")}
                </TabsTrigger>
                <TabsTrigger value="materiais" className="rounded-xl">
                  {t("docente.workspace.tabMaterials")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="visao" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="h-4 w-4 opacity-70" />
                      {t("docente.workspace.overview.scheduleTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("docente.workspace.overview.capacity", {
                        max: resumo.turma.capacidadeMaxima,
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resumo.turma.horarios.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.overview.noSchedule")}
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        {resumo.turma.horarios.map((h, i) => (
                          <li key={`${h.diaLabel}-${i}`}>
                            <span className="font-medium text-foreground">
                              {h.diaLabel}
                            </span>
                            : {h.horaInicio} – {h.horaFim}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 opacity-70" />
                      {t("docente.workspace.overview.enrolledTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t(
                        resumo.alunos.length === 1 ?
                          "docente.workspace.overview.activeStudentSingular"
                        : "docente.workspace.overview.activeStudentPlural",
                        { count: resumo.alunos.length }
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="divide-y divide-border/60 rounded-xl border border-border/50">
                      {resumo.alunos.map((a) => (
                        <li
                          key={a.matriculaId}
                          className="flex items-center justify-between px-3 py-2 text-sm"
                        >
                          <span>{a.nome}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="frequencia" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4 opacity-70" />
                      {t("docente.workspace.attendance.cardTitle")}
                    </CardTitle>
                    <CardDescription>
                      {t("docente.workspace.attendance.cardDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!resumo.disciplinas.length ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.attendance.noSubjects")}
                      </p>
                    ) : !resumo.alunos.length ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.attendance.noStudents")}
                      </p>
                    ) : (
                      <form className="space-y-4" onSubmit={handleRegistrarChamada}>
                        <div className="grid gap-2">
                          <Label htmlFor="disciplina">
                            {t("docente.workspace.attendance.disciplineLabel")}
                          </Label>
                          <select
                            id="disciplina"
                            className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={disciplinaId}
                            onChange={(e) => setDisciplinaId(e.target.value)}
                          >
                            {resumo.disciplinas.map((d) => (
                              <option key={d.id} value={d.id}>
                                {d.nome}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="dataAula">
                            {t("docente.workspace.attendance.dateLabel")}
                          </Label>
                          <Input
                            id="dataAula"
                            type="date"
                            value={dataAula}
                            onChange={(e) => setDataAula(e.target.value)}
                            className="max-w-xs rounded-xl"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="tituloAula">
                            {t("docente.workspace.attendance.titleLabel")}
                          </Label>
                          <Input
                            id="tituloAula"
                            value={tituloAula}
                            onChange={(e) => setTituloAula(e.target.value)}
                            placeholder={t("docente.workspace.attendance.titlePlaceholder")}
                            className="max-w-xl rounded-xl"
                          />
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="conteudoAula">
                            {t("docente.workspace.attendance.contentLabel")}
                          </Label>
                          <Textarea
                            id="conteudoAula"
                            value={conteudoAula}
                            onChange={(e) => setConteudoAula(e.target.value)}
                            placeholder={t("docente.workspace.attendance.contentPlaceholder")}
                            className="min-h-[88px] rounded-xl max-w-xl"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t("docente.workspace.attendance.presenceLabel")}</Label>
                          <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border/50 p-3">
                            {resumo.alunos.map((a) => (
                              <label
                                key={a.matriculaId}
                                className="flex cursor-pointer items-center gap-3 text-sm"
                              >
                                <Checkbox
                                  checked={presentes[a.matriculaId] ?? false}
                                  onCheckedChange={(v) => {
                                    setPresentes((prev) => ({
                                      ...prev,
                                      [a.matriculaId]: v === true,
                                    }));
                                  }}
                                />
                                <span>{a.nome}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={!podeRegistrar || submitting}
                          className="rounded-xl"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              {t("docente.workspace.attendance.saving")}
                            </>
                          ) : (
                            t("docente.workspace.attendance.saveButton")
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("docente.workspace.attendanceHistory.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("docente.workspace.attendanceHistory.desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {aulasRecentes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.attendanceHistory.empty")}
                      </p>
                    ) : (
                      <ul className="space-y-3 text-sm">
                        {aulasRecentes.map((aula) => (
                          <li
                            key={aula.id}
                            className="rounded-lg border border-border/40 px-3 py-2"
                          >
                            <span className="font-medium text-foreground">
                              {aula.disciplina?.nome ??
                                t("docente.workspace.attendanceHistory.disciplineFallback")}
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {formatDataCurta(aula.dataAula)}
                            </span>
                            {aula.titulo ? (
                              <p className="mt-1 text-sm text-foreground">{aula.titulo}</p>
                            ) : null}
                            {aula.conteudo ? (
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-3">
                                {aula.conteudo}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="avaliacoes" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("docente.workspace.newAssessmentSection.title")}
                    </CardTitle>
                    <CardDescription>
                      {t("docente.workspace.newAssessmentSection.desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="grid gap-3 max-w-xl" onSubmit={criarAvaliacao}>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.attendance.disciplineLabel")}</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={novaAvDisciplina}
                          onChange={(e) => setNovaAvDisciplina(e.target.value)}
                        >
                          {resumo.disciplinas.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.form.titleLabel")}</Label>
                        <Input
                          value={novaAvTitulo}
                          onChange={(e) => setNovaAvTitulo(e.target.value)}
                          placeholder={t("docente.workspace.form.newAssessmentPlaceholder")}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <div className="grid gap-2">
                          <Label>{t("docente.workspace.form.dateLabel")}</Label>
                          <Input
                            type="date"
                            value={novaAvData}
                            onChange={(e) => setNovaAvData(e.target.value)}
                            className="rounded-xl"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>{t("docente.workspace.form.weightOptional")}</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={novaAvPeso}
                            onChange={(e) => setNovaAvPeso(e.target.value)}
                            className="w-28 rounded-xl"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-fit rounded-xl">
                        {t("docente.workspace.newAssessmentSection.submitButton")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("docente.workspace.gradesSection.title")}
                    </CardTitle>
                    <CardDescription>
                      {loadingAv ?
                        t("common.loading")
                      : t("docente.workspace.gradesSection.count", {
                          count: avaliacoes.length,
                        })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {avaliacoes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.gradesSection.empty")}
                      </p>
                    ) : (
                      avaliacoes.map((av) => (
                        <div
                          key={av.id}
                          className="rounded-xl border border-border/50 p-4 space-y-3"
                        >
                          <div>
                            <p className="font-medium text-foreground">{av.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {av.disciplina.nome} ·{" "}
                              {formatDataCurta(av.dataAvaliacao)}
                              {av.peso != null ?
                                t("docente.workspace.gradesSection.weightLine", {
                                  weight: av.peso,
                                })
                              : ""}
                            </p>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {resumo.alunos.map((a) => (
                              <div key={a.matriculaId} className="flex items-center gap-2">
                                <Label className="w-28 shrink-0 truncate text-xs">
                                  {a.nome}
                                </Label>
                                <Input
                                  type="number"
                                  step="0.1"
                                  min={0}
                                  className="h-9 rounded-lg max-w-[100px]"
                                  value={
                                    notasDraft[av.id]?.[a.matriculaId] ?? ""
                                  }
                                  onChange={(e) =>
                                    setNotasDraft((prev) => ({
                                      ...prev,
                                      [av.id]: {
                                        ...(prev[av.id] || {}),
                                        [a.matriculaId]: e.target.value,
                                      },
                                    }))
                                  }
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              className="rounded-xl"
                              onClick={() => salvarNotas(av.id)}
                            >
                              {t("docente.workspace.gradesSection.saveButton")}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-xl"
                              asChild
                            >
                              <a
                                href={`/api/docente/avaliacoes/${av.id}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                {t("docente.workspace.gradesSection.downloadPdf")}
                              </a>
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="boletim" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("docente.workspace.reportCard.title")}
                    </CardTitle>
                    <CardDescription>{t("docente.workspace.reportCard.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-end gap-3">
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.reportCard.studentLabel")}</Label>
                        <Select
                          value={boletimMatriculaId}
                          onValueChange={setBoletimMatriculaId}
                        >
                          <SelectTrigger className="w-[260px] rounded-xl">
                            <SelectValue
                              placeholder={t("docente.workspace.reportCard.selectPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {resumo.alunos.map((a) => (
                              <SelectItem key={a.matriculaId} value={a.matriculaId}>
                                {a.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        type="button"
                        className="rounded-xl"
                        onClick={() => void carregarBoletim()}
                        disabled={!boletimMatriculaId || loadingBol}
                      >
                        {loadingBol ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          t("docente.workspace.reportCard.loadButton")
                        )}
                      </Button>
                    </div>

                    {boletimData ? (
                      <div className="rounded-xl border border-border/50 overflow-hidden">
                        <p className="bg-muted/40 px-3 py-2 text-sm font-medium">
                          {boletimData.aluno.nome}
                        </p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                              <th className="px-3 py-2">
                                {t("docente.workspace.reportCard.thDiscipline")}
                              </th>
                              <th className="px-3 py-2">
                                {t("docente.workspace.reportCard.thAverage")}
                              </th>
                              <th className="px-3 py-2">
                                {t("docente.workspace.reportCard.thAbsences")}
                              </th>
                              <th className="px-3 py-2">
                                {t("docente.workspace.reportCard.thAttendance")}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {boletimData.disciplinas.map((d) => (
                              <tr key={d.disciplinaNome} className="border-b border-border/40">
                                <td className="px-3 py-2">{d.disciplinaNome}</td>
                                <td className="px-3 py-2">
                                  {d.media != null ? d.media.toFixed(1) : "—"}
                                </td>
                                <td className="px-3 py-2">{d.faltas}</td>
                                <td className="px-3 py-2">
                                  {d.frequencia != null
                                    ? `${Math.round(d.frequencia)}%`
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="registros" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Megaphone className="h-4 w-4 opacity-70" />
                      {t("docente.workspace.recordsNew.title")}
                    </CardTitle>
                    <CardDescription>{t("docente.workspace.recordsNew.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form className="grid gap-3 max-w-xl" onSubmit={registrarPedagogico}>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.reportCard.studentLabel")}</Label>
                        <Select value={regAlunoId} onValueChange={setRegAlunoId}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue
                              placeholder={t("docente.workspace.reportCard.selectPlaceholder")}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {resumo.alunos.map((a) => (
                              <SelectItem key={a.alunoId} value={a.alunoId}>
                                {a.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.recordsNew.typeLabel")}</Label>
                        <Select value={regTipo} onValueChange={setRegTipo}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OBSERVACAO">
                              {tipoRegistroLabel.OBSERVACAO}
                            </SelectItem>
                            <SelectItem value="OCORRENCIA">
                              {tipoRegistroLabel.OCORRENCIA}
                            </SelectItem>
                            <SelectItem value="ADVERTENCIA">
                              {tipoRegistroLabel.ADVERTENCIA}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.form.titleLabel")}</Label>
                        <Input
                          value={regTitulo}
                          onChange={(e) => setRegTitulo(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t("docente.workspace.recordsNew.detailsOptional")}</Label>
                        <Textarea
                          value={regDesc}
                          onChange={(e) => setRegDesc(e.target.value)}
                          className="rounded-xl min-h-[80px]"
                        />
                      </div>
                      <Button type="submit" className="w-fit rounded-xl">
                        {t("docente.workspace.recordsNew.saveButton")}
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {t("docente.workspace.recordsHistory.title")}
                    </CardTitle>
                    <CardDescription>
                      {loadingReg ?
                        t("common.loading")
                      : t("docente.workspace.recordsHistory.count", {
                          count: registros.length,
                        })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {registros.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.recordsHistory.empty")}
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {registros.map((r) => (
                          <li
                            key={r.id}
                            className="rounded-lg border border-border/40 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{r.aluno.nome}</span>
                              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                                {tipoRegistroLabel[r.tipo] ?? r.tipo}
                              </span>
                            </div>
                            <p className="mt-0.5 font-medium text-foreground">{r.titulo}</p>
                            {r.descricao ? (
                              <p className="text-xs text-muted-foreground">{r.descricao}</p>
                            ) : null}
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {formatDataCurta(r.createdAt)}
                              {r.professor?.nome ? ` · ${r.professor.nome}` : ""}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materiais" className="space-y-4">
                <Card className="rounded-2xl border-border/60 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileStack className="h-4 w-4 opacity-70" />
                      {t("docente.workspace.materialsSection.title")}
                    </CardTitle>
                    <CardDescription>{t("docente.workspace.materialsSection.desc")}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="secondary" className="rounded-xl" asChild>
                      <Link href={`/docente/materiais?turmaId=${turmaId}`}>
                        {t("docente.workspace.materialsSection.openLibrary")}
                      </Link>
                    </Button>
                    {materiaisTurma.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {t("docente.workspace.materialsSection.empty")}
                      </p>
                    ) : (
                      <ul className="space-y-2 text-sm">
                        {materiaisTurma.map((m) => (
                          <li key={m.id}>
                            <a
                              href={m.arquivoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                              {m.titulo}
                            </a>
                            <span className="block text-xs text-muted-foreground">
                              {tipoMaterialLabel[m.tipo] ?? m.tipo}
                              {m.disciplina?.nome ? ` · ${m.disciplina.nome}` : ""}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : null}
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
