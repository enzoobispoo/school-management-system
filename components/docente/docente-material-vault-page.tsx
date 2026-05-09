"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, FileUp, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import type { TipoMaterialDidatico } from "@prisma/client";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DocenteMateriaisTabs } from "@/components/docente/docente-materiais-tabs";
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
import { Textarea } from "@/components/ui/textarea";

type OverviewTurma = {
  id: string;
  nome: string;
  cursoNome: string;
};

type MaterialRow = {
  id: string;
  titulo: string;
  tipo: string;
  descricao: string | null;
  arquivoUrl: string | null;
  arquivoNome: string | null;
  slideDeckJson?: unknown | null;
  createdAt: string;
  turma: { id: string; nome: string } | null;
  disciplina: { id: string; nome: string } | null;
};

const TIPO_LABEL: Record<TipoMaterialDidatico, string> = {
  SLIDE: "Slides (aula)",
  ATIVIDADE_IMPRESSAO: "Atividade para impressão",
  PROVA_IMPRESSAO: "Prova para impressão",
  PLANO_AULA: "Plano de aula",
  REFERENCIA: "Referência / leitura",
  OUTRO: "Outro",
};

type VaultCopy = {
  title: string;
  description: string;
  uploadHint: string;
  futureBlurb: string;
};

const VAULT_COPY: Record<TipoMaterialDidatico, VaultCopy> = {
  SLIDE: {
    title: "Apresentações — seu arquivo",
    description:
      "Crie slides no próprio sistema (visual tipo telas fixas) ou envie PDF/PowerPoint exportados.",
    uploadHint:
      "Ideal para slides exportados (PDF ou PowerPoint). Associe a uma turma só se quiser organizar.",
    futureBlurb: "",
  },
  PROVA_IMPRESSAO: {
    title: "Provas impressas — seu arquivo",
    description:
      "Armazene PDFs ou documentos de provas que você elabora fora do sistema e quer manter à mão.",
    uploadHint:
      "Envie a versão que vai para a impressão; você continua podendo lançar notas pela turma.",
    futureBlurb:
      "Para registrar prova/avaliação na turma e lançar notas, use Nova avaliação no workspace docente.",
  },
  ATIVIDADE_IMPRESSAO: {
    title: "Atividades impressas — seu arquivo",
    description:
      "Folhas de exercício, listas e atividades extras que você gera fora da plataforma.",
    uploadHint:
      "Organize por turma quando fizer sentido; também pode deixar como material geral.",
    futureBlurb:
      "Para avaliações com notas no sistema, use Nova avaliação; este ambiente é só o arquivo em PDF/doc.",
  },
  PLANO_AULA: {
    title: "Planos de aula — seu arquivo",
    description: "Documentos de planejamento que você produz.",
    uploadHint: "PDF ou Word.",
    futureBlurb: "",
  },
  REFERENCIA: {
    title: "Referências — seu arquivo",
    description: "Leituras complementares e materiais de apoio.",
    uploadHint: "PDF, imagens ou documentos.",
    futureBlurb: "",
  },
  OUTRO: {
    title: "Outros materiais",
    description: "Arquivos diversos da sua biblioteca.",
    uploadHint: "",
    futureBlurb: "",
  },
};

export function DocenteMaterialVaultPage(props: {
  fixedTipo: TipoMaterialDidatico;
}) {
  const { fixedTipo } = props;
  const copy = VAULT_COPY[fixedTipo];
  const router = useRouter();
  const searchParams = useSearchParams();
  const turmaIdFromUrl = searchParams.get("turmaId") || "";

  const [turmas, setTurmas] = useState<OverviewTurma[]>([]);
  const [needsLink, setNeedsLink] = useState(false);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [turmaId, setTurmaId] = useState(turmaIdFromUrl);
  const [disciplinaId, setDisciplinaId] = useState("");

  const [disciplinasTurma, setDisciplinasTurma] = useState<
    { id: string; nome: string }[]
  >([]);
  const [creatingDeck, setCreatingDeck] = useState(false);

  const loadOverview = useCallback(async () => {
    const res = await fetch("/api/docente/overview", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao carregar turmas.");
    setNeedsLink(Boolean(json.needsLink));
    const list = (json.turmas || []) as OverviewTurma[];
    setTurmas(list);
    if (turmaIdFromUrl && list.some((t) => t.id === turmaIdFromUrl)) {
      setTurmaId(turmaIdFromUrl);
    }
  }, [turmaIdFromUrl]);

  const loadDisciplinas = useCallback(async (tid: string) => {
    if (!tid) {
      setDisciplinasTurma([]);
      setDisciplinaId("");
      return;
    }
    const res = await fetch(`/api/docente/turmas/${tid}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      setDisciplinasTurma([]);
      return;
    }
    const d = (json.disciplinas || []) as { id: string; nome: string }[];
    setDisciplinasTurma(d);
    setDisciplinaId(d[0]?.id ?? "");
  }, []);

  const loadMaterials = useCallback(async () => {
    const qs = new URLSearchParams();
    qs.set("tipo", fixedTipo);
    const res = await fetch(`/api/docente/materiais?${qs}`, {
      cache: "no-store",
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Erro ao listar materiais.");
    setMaterials(json as MaterialRow[]);
  }, [fixedTipo]);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadOverview();
        await loadMaterials();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar.");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadOverview, loadMaterials]);

  useEffect(() => {
    void loadDisciplinas(turmaId);
  }, [turmaId, loadDisciplinas]);

  const filteredList = useMemo(() => {
    if (!turmaId) return materials;
    return materials.filter((m) => m.turma?.id === turmaId);
  }, [materials, turmaId]);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    const input = document.getElementById("material-file") as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file || !titulo.trim()) {
      toast.error("Selecione um arquivo e informe o título.");
      return;
    }
    if (needsLink) {
      toast.error("Conta não vinculada ao professor.");
      return;
    }

    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("titulo", titulo.trim());
      fd.append("tipo", fixedTipo);
      if (descricao.trim()) fd.append("descricao", descricao.trim());
      if (turmaId) fd.append("turmaId", turmaId);
      if (disciplinaId && turmaId) fd.append("disciplinaId", disciplinaId);

      const res = await fetch("/api/docente/materiais", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha no envio.");

      toast.success("Arquivo armazenado na sua biblioteca.");
      setTitulo("");
      setDescricao("");
      if (input) input.value = "";
      await loadMaterials();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateDeck() {
    if (needsLink) return;
    try {
      setCreatingDeck(true);
      const res = await fetch("/api/docente/materiais/slide-deck", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim() || "Nova apresentação",
          ...(descricao.trim() ? { descricao: descricao.trim() } : {}),
          ...(turmaId ? { turmaId } : {}),
          ...(turmaId && disciplinaId ? { disciplinaId } : {}),
        }),
      });
      const json = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) throw new Error(json.error || "Erro ao criar apresentação.");
      if (!json.id) throw new Error("Resposta inválida.");
      toast.success("Abrindo editor…");
      router.push(`/docente/materiais/apresentacoes/editor/${json.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar.");
    } finally {
      setCreatingDeck(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title={copy.title} description={copy.description} />

      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-6 pt-2">
          <DocenteMateriaisTabs />

          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          {needsLink ? (
            <p className="text-sm text-muted-foreground">
              Vincule sua conta ao cadastro de professor para enviar materiais.
            </p>
          ) : null}

          {fixedTipo === "SLIDE" ?
            <Card className="rounded-2xl border-border/60 bg-muted/10 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Presentation className="h-5 w-5 text-primary" />
                  Criar no editor (tipo Canva simplificado)
                </CardTitle>
                <CardDescription className="text-sm">
                  Slides com título, subtítulo e marcadores; salvamento automático. Não substitui um
                  editor de design completo, mas cobre aulas rápidas sem sair da escola.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  type="button"
                  className="rounded-xl gap-2"
                  disabled={creatingDeck || needsLink}
                  onClick={() => void handleCreateDeck()}
                >
                  {creatingDeck ?
                    <Loader2 className="h-4 w-4 animate-spin" />
                  : <Presentation className="h-4 w-4" />}
                  Nova apresentação no editor
                </Button>
              </CardContent>
            </Card>
          : copy.futureBlurb ?
            <Card className="rounded-2xl border-dashed border-primary/25 bg-primary/[0.03] shadow-none">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  Criação pelo sistema
                </CardTitle>
                <CardDescription className="text-xs">{copy.futureBlurb}</CardDescription>
              </CardHeader>
            </Card>
          : null}

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileUp className="h-5 w-5 opacity-70" />
                Enviar arquivo
              </CardTitle>
              <CardDescription className="text-sm">
                PDF, PowerPoint, Word ou imagens (até 15MB). Tipo fixo:{" "}
                <strong>{TIPO_LABEL[fixedTipo]}</strong>. {copy.uploadHint}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid max-w-xl gap-4" onSubmit={handleUpload}>
                <div className="grid gap-2">
                  <Label htmlFor="material-file">Arquivo</Label>
                  <Input
                    id="material-file"
                    type="file"
                    accept=".pdf,.ppt,.pptx,.doc,.docx,image/png,image/jpeg,image/webp"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Título</Label>
                  <Input
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex.: Slides — revisão para prova"
                    className="rounded-xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Turma (opcional)</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={turmaId}
                    onChange={(e) => setTurmaId(e.target.value)}
                  >
                    <option value="">Geral (sem turma)</option>
                    {turmas.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nome} — {t.cursoNome}
                      </option>
                    ))}
                  </select>
                </div>
                {turmaId && disciplinasTurma.length > 0 ? (
                  <div className="grid gap-2">
                    <Label>Disciplina (opcional)</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={disciplinaId}
                      onChange={(e) => setDisciplinaId(e.target.value)}
                    >
                      <option value="">Qualquer / não especificar</option>
                      {disciplinasTurma.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <div className="grid gap-2">
                  <Label>Descrição (opcional)</Label>
                  <Textarea
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    className="min-h-[72px] rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={uploading || needsLink}
                  className="w-fit rounded-xl"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Enviando…
                    </>
                  ) : (
                    "Salvar na biblioteca"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/60 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Seus arquivos neste ambiente</CardTitle>
              <CardDescription className="text-sm">
                {turmaId
                  ? "Filtrando pela turma selecionada acima."
                  : "Todos os envios classificados nesta área."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Carregando…
                </p>
              ) : filteredList.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum arquivo ainda. Envie o primeiro acima.
                </p>
              ) : (
                <ul className="divide-y divide-border/60 rounded-xl border border-border/50">
                  {filteredList.map((m) => (
                    <li key={m.id} className="px-3 py-3 text-sm">
                      {m.slideDeckJson ?
                        <Link
                          href={`/docente/materiais/apresentacoes/editor/${m.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {m.titulo}
                        </Link>
                      : m.arquivoUrl ?
                        <a
                          href={m.arquivoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary hover:underline"
                        >
                          {m.titulo}
                        </a>
                      : <span className="font-medium text-foreground">{m.titulo}</span>}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {TIPO_LABEL[m.tipo as TipoMaterialDidatico] ?? m.tipo}
                        {m.turma?.nome ? ` · ${m.turma.nome}` : ""}
                        {m.disciplina?.nome ? ` · ${m.disciplina.nome}` : ""}
                      </p>
                      {m.descricao ? (
                        <p className="mt-1 text-xs text-muted-foreground">{m.descricao}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
