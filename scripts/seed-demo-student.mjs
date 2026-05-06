import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida.");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

const DEMO_EMAIL = "aluno.demo.tudo@seed.local";
const DEMO_CPF = "52998224725"; // CPF fictício comum em ambientes de teste (único por escola após limpeza)
const CURSO_NOME = "Seed Demo Curso";
const TURMA_NOME = "[Seed Demo] Turma Alfa";
const PROF_EMAIL = "seed.demo.professor@local.invalid";

const DISCIPLINAS = [
  { nome: "Seed Demo Portugues", codigo: "PORT-DEMO" },
  { nome: "Seed Demo Matematica", codigo: "MAT-DEMO" },
  { nome: "Seed Demo Ciencias", codigo: "CIE-DEMO" },
];

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function isMissingTableError(e) {
  return e?.code === "P2021" || e?.code === "P2022";
}

async function resolveSchoolId() {
  const envId = process.env.DEMO_SCHOOL_ID?.trim();
  if (envId) return envId;

  const user = await prisma.user.findFirst({
    where: { schoolId: { not: null } },
    orderBy: { createdAt: "asc" },
    select: { schoolId: true },
  });
  if (user?.schoolId) return user.schoolId;

  const school = await prisma.school.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return school?.id ?? null;
}

async function ensureDisciplina(schoolId, row) {
  const existing = await prisma.disciplina.findFirst({
    where: { schoolId, nome: row.nome },
  });
  if (existing) return existing;
  return prisma.disciplina.create({
    data: { schoolId, nome: row.nome, codigo: row.codigo, ativo: true },
  });
}

async function ensureTurmaDisciplina(schoolId, turmaId, disciplinaId) {
  const existing = await prisma.turmaDisciplina.findFirst({
    where: { turmaId, disciplinaId },
  });
  if (existing) return existing;
  return prisma.turmaDisciplina.create({
    data: { schoolId, turmaId, disciplinaId },
  });
}

async function seedBoletimChamadas({ schoolId, turma, professor, matricula, hoje }) {
  const disciplinas = [];
  for (const d of DISCIPLINAS) {
    const disc = await ensureDisciplina(schoolId, d);
    disciplinas.push(disc);
    await ensureTurmaDisciplina(schoolId, turma.id, disc.id);
  }

  const avaliacoesMeta = [
    { titulo: "Prova U1", diasAtraso: 14, peso: "1", notas: ["8.5", "7.0", "9.0"] },
    {
      titulo: "Trabalho PI",
      diasAtraso: 7,
      peso: "1",
      notas: ["9.5", "8.0", "8.5"],
    },
  ];

  const avaliacaoIds = [];
  for (let di = 0; di < disciplinas.length; di++) {
    const disc = disciplinas[di];
    for (const meta of avaliacoesMeta) {
      const av = await prisma.avaliacao.create({
        data: {
          schoolId,
          turmaId: turma.id,
          disciplinaId: disc.id,
          professorId: professor.id,
          titulo: `${disc.nome} - ${meta.titulo}`,
          descricao: "Seed demo.",
          peso: new Prisma.Decimal(meta.peso),
          dataAvaliacao: addDays(hoje, -meta.diasAtraso),
        },
      });
      avaliacaoIds.push({ av, nota: meta.notas[di] });
    }
  }

  for (const { av, nota } of avaliacaoIds) {
    const notaNum = Number(nota);
    await prisma.notaAvaliacao.create({
      data: {
        schoolId,
        avaliacaoId: av.id,
        matriculaId: matricula.id,
        nota: new Prisma.Decimal(nota),
        observacao:
          notaNum >= 9 ? "Excelente desempenho." : "Desempenho adequado às expectativas.",
      },
    });
  }

  let dia = -28;
  for (const disc of disciplinas) {
    for (let i = 0; i < 6; i++) {
      const dataAula = addDays(hoje, dia);
      dia += 3;
      const aula = await prisma.aulaRegistro.create({
        data: {
          schoolId,
          turmaId: turma.id,
          disciplinaId: disc.id,
          titulo: `${disc.nome} - Aula ${i + 1}`,
          conteudo: "Conteudo de aula demo.",
          dataAula,
        },
      });
      await prisma.presencaAula.create({
        data: {
          schoolId,
          aulaId: aula.id,
          matriculaId: matricula.id,
          presente: !(disc.codigo === "MAT-DEMO" && i === 2),
          observacao:
            disc.codigo === "MAT-DEMO" && i === 2 ? "Falta justificada (consulta médica)." : null,
        },
      });
    }
  }

}

async function main() {
  const schoolId = await resolveSchoolId();
  if (!schoolId) {
    console.error(
      "Nenhuma escola encontrada. Defina DEMO_SCHOOL_ID ou crie uma escola/usuário com schoolId."
    );
    process.exit(1);
  }

  console.log(`Escola alvo: ${schoolId}\n`);

  let professor = await prisma.professor.findFirst({
    where: { schoolId, email: PROF_EMAIL },
  });
  if (!professor) {
    professor = await prisma.professor.create({
      data: {
        schoolId,
        nome: "Prof. Demonstração Seed",
        email: PROF_EMAIL,
        telefone: "11988887777",
        ativo: true,
      },
    });
  }

  let curso = await prisma.curso.findFirst({
    where: { schoolId, nome: CURSO_NOME },
  });
  if (!curso) {
    curso = await prisma.curso.create({
      data: {
        schoolId,
        nome: CURSO_NOME,
        categoria: "Demonstração",
        descricao: "Turma e curso criados apenas para visualização completa no sistema.",
        valorMensal: new Prisma.Decimal("349.90"),
        duracaoTexto: "12 meses",
        ativo: true,
      },
    });
  }

  await prisma.professorCurso.upsert({
    where: {
      professorId_cursoId: { professorId: professor.id, cursoId: curso.id },
    },
    update: {},
    create: { professorId: professor.id, cursoId: curso.id },
  });

  let turma = await prisma.turma.findFirst({
    where: { schoolId, cursoId: curso.id, nome: TURMA_NOME },
  });
  if (!turma) {
    turma = await prisma.turma.create({
      data: {
        schoolId,
        cursoId: curso.id,
        professorId: professor.id,
        nome: TURMA_NOME,
        capacidadeMaxima: 35,
        ativo: true,
        horarios: {
          create: [
            { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "12:00" },
            { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "12:00" },
          ],
        },
      },
    });
  }

  try {
    await prisma.avaliacao.deleteMany({ where: { schoolId, turmaId: turma.id } });
    await prisma.aulaRegistro.deleteMany({ where: { schoolId, turmaId: turma.id } });
  } catch (e) {
    if (!isMissingTableError(e)) throw e;
    console.warn(
      "⚠️  Tabelas acadêmicas ainda não existem neste banco — pulando limpeza de boletim/chamadas.\n"
    );
  }

  await prisma.aluno.deleteMany({ where: { schoolId, email: DEMO_EMAIL } });

  const hoje = new Date();
  const aluno = await prisma.aluno.create({
    data: {
      schoolId,
      nome: "Helena Demo",
      email: DEMO_EMAIL,
      cpf: DEMO_CPF,
      telefone: "11977776666",
      dataNascimento: addYears(hoje, -11),
      endereco: "Rua Demo, 100 - Centro",
      status: "ATIVO",
      responsavelNome: "Marina Demo",
      responsavelTelefone: "11966665555",
      responsavelEmail: "responsavel.demo@seed.local",
      responsavelCpf: "11144477735",
      observacoesGerais: "Aluno demo com dados completos.",
      indicacao: "Seed interno",
      nivelInicial: "Intermediário",
      idiomaNativo: "Portugues",
      possuiLaudo: true,
      laudoTipo: "TEA",
      laudoCid: "F84.0",
      laudoNivel: "Nivel 1",
      laudoProfissional: "Dra Carla Mendes",
      laudoData: addMonths(hoje, -8),
      laudoDescricao: "Laudo completo para acompanhamento escolar.",
      adaptacaoNecessaria: true,
      adaptacaoDescricao: "Tempo extra e apoio visual.",
      alergias: "Amendoim",
      medicamentos: "Melatonina 3mg",
      condicoesCronicas: "Sensibilidade auditiva leve",
      planoSaude: "Unimed — carteirinha familiar",
      contatoEmergenciaNome: "Marina Demo",
      contatoEmergenciaTelefone: "11966665555",
      observacoesMedicas: "Plano de acao de alergia registrado.",
      observacoesProf: "Boa resposta com rotina visual.",
      tratamentos: "TO semanal e fono quinzenal.",
    },
  });

  const matricula = await prisma.matricula.create({
    data: {
      schoolId,
      alunoId: aluno.id,
      turmaId: turma.id,
      status: "ATIVA",
      dataMatricula: addDays(hoje, -45),
      observacoes: "Matricula demo.",
    },
  });

  try {
    await seedBoletimChamadas({
      schoolId,
      turma,
      professor,
      matricula,
      hoje,
    });
    console.log("📘 Boletim e chamadas (notas + frequência) criados.\n");
  } catch (e) {
    if (!isMissingTableError(e)) throw e;
    console.warn(
      "⚠️  Migrações acadêmicas não aplicadas — aluno criado sem boletim/chamadas. Rode: npx prisma migrate deploy\n"
    );
  }

  const competenciaBase = new Date(hoje.getFullYear(), hoje.getMonth(), 10);
  const pagamentosSpec = [
    { offset: -2, status: "PAGO", desc: "Mensalidade paga" },
    { offset: -1, status: "PAGO", desc: "Mensalidade paga" },
    { offset: 0, status: "PENDENTE", desc: "Mensalidade pendente" },
    { offset: -4, status: "ATRASADO", desc: "Mensalidade atrasada" },
  ];

  for (const p of pagamentosSpec) {
    const venc = addMonths(competenciaBase, p.offset);
    await prisma.pagamento.create({
      data: {
        schoolId,
        matriculaId: matricula.id,
        competenciaMes: venc.getMonth() + 1,
        competenciaAno: venc.getFullYear(),
        descricao: `${p.desc} — ${curso.nome}`,
        valor: curso.valorMensal,
        vencimento: venc,
        status: p.status,
        dataPagamento: p.status === "PAGO" ? addDays(venc, -1) : null,
        metodoPagamento: p.status === "PAGO" ? "PIX" : null,
      },
    });
  }
  console.log("💳 Mensalidades de exemplo criadas.\n");

  try {
    await prisma.alunoRegistro.createMany({
      data: [
        {
          schoolId,
          alunoId: aluno.id,
          tipo: "OCORRENCIA",
          titulo: "Atraso recorrente na entrada",
          descricao:
            "Chegou atrasado em duas aulas.",
          gravidade: "Baixa",
        },
        {
          schoolId,
          alunoId: aluno.id,
          tipo: "OCORRENCIA",
          titulo: "Esquecimento de material",
          descricao: "Sem caderno em uma aula.",
          gravidade: "Baixa",
        },
        {
          schoolId,
          alunoId: aluno.id,
          tipo: "ADVERTENCIA",
          titulo: "Uso inadequado de equipamento",
          descricao: "Uso indevido do tablet em aula.",
          gravidade: "Média",
        },
        {
          schoolId,
          alunoId: aluno.id,
          tipo: "OBSERVACAO",
          titulo: "Destaque em trabalho em grupo",
          descricao: "Boa participacao em grupo.",
          gravidade: null,
        },
        {
          schoolId,
          alunoId: aluno.id,
          tipo: "OBSERVACAO",
          titulo: "Plano de apoio funcionando bem",
          descricao: "Tempo extra permitiu conclusão da avaliação sem estresse aparente.",
          gravidade: null,
        },
      ],
    });
    console.log("📋 Registros (ocorrências / advertências / observações) criados.\n");
  } catch (e) {
    if (!isMissingTableError(e)) throw e;
    console.warn(
      "⚠️  Tabela AlunoRegistro ausente — rode as migrações para ver o histórico na ficha do aluno.\n"
    );
  }

  try {
    await prisma.alunoDocumento.create({
      data: {
        alunoId: aluno.id,
        nome: "Laudo neuropsicológico (exemplo).pdf",
        tipo: "LAUDO",
        url: "https://example.com/documentos/laudo-demo-placeholder.pdf",
        tamanho: 524288,
      },
    });
    console.log("📎 Documento de exemplo vinculado ao aluno.\n");
  } catch (e) {
    if (!isMissingTableError(e)) throw e;
    console.warn("⚠️  Tabela AlunoDocumento ausente — ignorando anexo de laudo.\n");
  }

  console.log("✅ Aluno demo pronto.\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(` Nome:   ${aluno.nome}`);
  console.log(` Email:  ${aluno.email}`);
  console.log(` ID:     ${aluno.id}`);
  console.log(` Turma:  ${turma.nome}`);
  console.log(` Curso:  ${curso.nome}`);
  console.log(` Matrícula: ${matricula.id}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("\nNo app: busque por «Helena Demo» ou filtre em /alunos.");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar aluno demo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
