import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { ResourcePageHeader } from "@/components/dashboard/resource-page-header";
import { AlunoProfileContent } from "@/components/alunos/profile/aluno-profile-content";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const aluno = await prisma.aluno.findUnique({ where: { id }, select: { nome: true } });
  return { title: aluno ? aluno.nome : "Aluno" };
}

export default async function AlunoProfilePage({ params }: Props) {
  const { id } = await params;

  const aluno = await prisma.aluno.findUnique({
    where: { id },
    include: {
      matriculas: {
        include: {
          turma: { include: { curso: true, professor: true, horarios: true } },
          pagamentos: { orderBy: { vencimento: "desc" } },
        },
        orderBy: { createdAt: "desc" },
      },
      documentos: { orderBy: { createdAt: "desc" } },
      statusHistorico: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!aluno) notFound();

  // serializa Decimal e Date para plain objects antes de passar ao client
  const data = {
    ...aluno,
    matriculas: aluno.matriculas.map((m) => ({
      ...m,
      dataMatricula: m.dataMatricula.toISOString(),
      dataCancelamento: m.dataCancelamento?.toISOString() ?? null,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
      turma: {
        ...m.turma,
        createdAt: m.turma.createdAt.toISOString(),
        updatedAt: m.turma.updatedAt.toISOString(),
        curso: {
          ...m.turma.curso,
          valorMensal: Number(m.turma.curso.valorMensal),
          createdAt: m.turma.curso.createdAt.toISOString(),
          updatedAt: m.turma.curso.updatedAt.toISOString(),
        },
        professor: {
          ...m.turma.professor,
          createdAt: m.turma.professor.createdAt.toISOString(),
          updatedAt: m.turma.professor.updatedAt.toISOString(),
        },
        horarios: m.turma.horarios.map((h) => ({
          ...h,
          createdAt: h.createdAt.toISOString(),
          updatedAt: h.updatedAt.toISOString(),
        })),
      },
      pagamentos: m.pagamentos.map((p) => ({
        ...p,
        valor: Number(p.valor),
        vencimento: p.vencimento.toISOString(),
        dataPagamento: p.dataPagamento?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        boletoGeradoEm: p.boletoGeradoEm?.toISOString() ?? null,
        ultimoLembreteEnviadoEm: p.ultimoLembreteEnviadoEm?.toISOString() ?? null,
      })),
    })),
    documentos: aluno.documentos.map((d) => ({
      ...d,
      createdAt: d.createdAt.toISOString(),
    })),
    statusHistorico: aluno.statusHistorico.map((h) => ({
      ...h,
      createdAt: h.createdAt.toISOString(),
    })),
    dataNascimento: aluno.dataNascimento?.toISOString() ?? null,
    laudoData: aluno.laudoData?.toISOString() ?? null,
    dataSaida: aluno.dataSaida?.toISOString() ?? null,
    createdAt: aluno.createdAt.toISOString(),
    updatedAt: aluno.updatedAt.toISOString(),
  };

  return (
    <DashboardLayout>
      <ResourcePageHeader title={aluno.nome} variant="student" />
      <AlunoProfileContent aluno={data as any} />
    </DashboardLayout>
  );
}
