import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL não definida para seed de cenário docente.");
}
const pool = new pg.Pool({ connectionString, max: 2 });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysAhead(n, h = 9, m = 0) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(h, m, 0, 0);
  return d;
}

const DAY_ENUM = ["DOMINGO", "SEGUNDA", "TERCA", "QUARTA", "QUINTA", "SEXTA", "SABADO"];

async function main() {
  const stamp = Date.now().toString().slice(-6);
  const school = await prisma.school.findFirst({ where: { ativo: true }, orderBy: { createdAt: "asc" } });
  if (!school) throw new Error("Nenhuma escola ativa encontrada.");

  const userProfessor =
    (await prisma.user.findFirst({
      where: { schoolId: school.id, role: "PROFESSOR", ativo: true },
      orderBy: { createdAt: "asc" },
    })) ??
    (await prisma.user.create({
      data: {
        schoolId: school.id,
        nome: `Professor Demo ${stamp}`,
        email: `prof.demo.${stamp}@example.com`,
        passwordHash: "seed-only",
        role: "PROFESSOR",
      },
    }));

  const professor =
    (userProfessor.professorId
      ? await prisma.professor.findUnique({ where: { id: userProfessor.professorId } })
      : null) ??
    (await prisma.professor.create({
      data: {
        schoolId: school.id,
        nome: `Professor Demo ${stamp}`,
        email: userProfessor.email,
      },
    }));

  if (!userProfessor.professorId) {
    await prisma.user.update({
      where: { id: userProfessor.id },
      data: { professorId: professor.id },
    });
  }

  const profAnterior = await prisma.professor.create({
    data: {
      schoolId: school.id,
      nome: `Professor Anterior ${stamp}`,
      email: `prof.anterior.${stamp}@example.com`,
    },
  });

  const curso = await prisma.curso.create({
    data: {
      schoolId: school.id,
      nome: `Curso Dashboard ${stamp}`,
      categoria: "Idioma",
      valorMensal: 450,
    },
  });

  const turmaA = await prisma.turma.create({
    data: {
      schoolId: school.id,
      cursoId: curso.id,
      professorId: professor.id,
      nome: `Turma A ${stamp}`,
      capacidadeMaxima: 30,
      horarios: {
        create: [
          { diaSemana: "SEGUNDA", horaInicio: "08:00", horaFim: "09:30" },
          { diaSemana: "QUARTA", horaInicio: "08:00", horaFim: "09:30" },
          { diaSemana: DAY_ENUM[new Date().getDay()], horaInicio: "10:00", horaFim: "11:30" },
        ],
      },
    },
  });

  const turmaB = await prisma.turma.create({
    data: {
      schoolId: school.id,
      cursoId: curso.id,
      professorId: professor.id,
      nome: `Turma B ${stamp}`,
      capacidadeMaxima: 30,
      horarios: {
        create: [
          { diaSemana: "TERCA", horaInicio: "14:00", horaFim: "15:30" },
          { diaSemana: "QUINTA", horaInicio: "14:00", horaFim: "15:30" },
        ],
      },
    },
  });

  const [discPort, discGram, discConv] = await Promise.all([
    prisma.disciplina.create({ data: { schoolId: school.id, nome: `Português ${stamp}` } }),
    prisma.disciplina.create({ data: { schoolId: school.id, nome: `Gramática ${stamp}` } }),
    prisma.disciplina.create({ data: { schoolId: school.id, nome: `Conversação ${stamp}` } }),
  ]);

  await prisma.turmaDisciplina.createMany({
    data: [
      { schoolId: school.id, turmaId: turmaA.id, disciplinaId: discPort.id },
      { schoolId: school.id, turmaId: turmaA.id, disciplinaId: discGram.id },
      { schoolId: school.id, turmaId: turmaB.id, disciplinaId: discConv.id },
    ],
    skipDuplicates: true,
  });

  const alunos = [];
  for (let i = 1; i <= 12; i += 1) {
    const aluno = await prisma.aluno.create({
      data: {
        schoolId: school.id,
        nome: `Aluno Teste ${stamp}-${i}`,
        email: `aluno.${stamp}.${i}@example.com`,
        cpf: `${stamp}${String(i).padStart(5, "0")}`,
      },
    });
    alunos.push(aluno);
  }

  const matriculas = await Promise.all(
    alunos.map((aluno, idx) =>
      prisma.matricula.create({
        data: {
          schoolId: school.id,
          alunoId: aluno.id,
          turmaId: idx < 7 ? turmaA.id : turmaB.id,
          status: "ATIVA",
        },
      })
    )
  );

  const avaliacaoA = await prisma.avaliacao.create({
    data: {
      schoolId: school.id,
      turmaId: turmaA.id,
      disciplinaId: discPort.id,
      professorId: professor.id,
      titulo: `Prova Bimestral ${stamp}`,
      dataAvaliacao: daysAgo(3),
      descricao: "Prova completa",
      peso: 2,
    },
  });

  const avaliacaoB = await prisma.avaliacao.create({
    data: {
      schoolId: school.id,
      turmaId: turmaB.id,
      disciplinaId: discConv.id,
      professorId: professor.id,
      titulo: `Atividade oral ${stamp}`,
      dataAvaliacao: daysAgo(2),
      peso: 1,
    },
  });

  const matA = matriculas.filter((m) => m.turmaId === turmaA.id);
  const matB = matriculas.filter((m) => m.turmaId === turmaB.id);
  await prisma.notaAvaliacao.createMany({
    data: [
      ...matA.slice(0, 5).map((m, i) => ({
        schoolId: school.id,
        avaliacaoId: avaliacaoA.id,
        matriculaId: m.id,
        nota: i < 2 ? 4.5 : 7.5,
      })),
      ...matB.slice(0, 3).map((m, i) => ({
        schoolId: school.id,
        avaliacaoId: avaliacaoB.id,
        matriculaId: m.id,
        nota: i === 0 ? 5 : 8,
      })),
    ],
    skipDuplicates: true,
  });

  for (let d = 1; d <= 20; d += 1) {
    const aula = await prisma.aulaRegistro.create({
      data: {
        schoolId: school.id,
        turmaId: d % 2 === 0 ? turmaA.id : turmaB.id,
        disciplinaId: d % 2 === 0 ? discPort.id : discConv.id,
        dataAula: daysAgo(d),
        titulo: `Aula ${d} ${stamp}`,
      },
    });
    const turmaMats = d % 2 === 0 ? matA : matB;
    await prisma.presencaAula.createMany({
      data: turmaMats.map((m, idx) => ({
        schoolId: school.id,
        aulaId: aula.id,
        matriculaId: m.id,
        presente: !(idx === 0 || (idx === 1 && d % 3 === 0)),
      })),
      skipDuplicates: true,
    });
  }

  await prisma.evento.createMany({
    data: [
      {
        schoolId: school.id,
        titulo: `Revisão ${stamp}`,
        descricao: "Revisão para prova",
        tipo: "LEMBRETE",
        dataInicio: daysAhead(1, 10, 0),
        dataFim: daysAhead(1, 11, 30),
        professorId: professor.id,
        turmaId: turmaA.id,
        cursoId: curso.id,
      },
      {
        schoolId: school.id,
        titulo: `Simulado ${stamp}`,
        descricao: "Atividade prática",
        tipo: "PROVA",
        dataInicio: daysAhead(3, 14, 0),
        dataFim: daysAhead(3, 15, 30),
        professorId: professor.id,
        turmaId: turmaB.id,
        cursoId: curso.id,
      },
    ],
  });

  await prisma.materialDidatico.createMany({
    data: [
      {
        schoolId: school.id,
        professorId: professor.id,
        turmaId: turmaA.id,
        disciplinaId: discPort.id,
        tipo: "PLANO_AULA",
        titulo: `Plano Aula ${stamp}`,
        arquivoUrl: "https://example.com/plano-aula.pdf",
        arquivoNome: `plano-${stamp}.pdf`,
      },
      {
        schoolId: school.id,
        professorId: professor.id,
        turmaId: turmaA.id,
        disciplinaId: discGram.id,
        tipo: "ATIVIDADE_IMPRESSAO",
        titulo: `Atividade Fixação ${stamp}`,
        arquivoUrl: "https://example.com/atividade.pdf",
        arquivoNome: `atividade-${stamp}.pdf`,
      },
      {
        schoolId: school.id,
        professorId: professor.id,
        turmaId: turmaB.id,
        disciplinaId: discConv.id,
        tipo: "PROVA_IMPRESSAO",
        titulo: `Prova Conversação ${stamp}`,
        arquivoUrl: "https://example.com/prova.pdf",
        arquivoNome: `prova-${stamp}.pdf`,
      },
    ],
  });

  await prisma.notificacao.createMany({
    data: [
      {
        schoolId: school.id,
        tipo: "TROCA_PROFESSOR_SOLICITADA",
        titulo: `Conselho de Classe ${stamp}`,
        mensagem: "Feche presença e notas até sexta-feira.",
        destinatarioProfessorId: professor.id,
      },
      {
        schoolId: school.id,
        tipo: "SISTEMA",
        titulo: `Nova diretriz pedagógica ${stamp}`,
        mensagem: "Atualizamos o modelo de plano de aula.",
      },
    ],
  });

  await prisma.trocaProfessorProposta.create({
    data: {
      schoolId: school.id,
      turmaId: turmaA.id,
      professorAnteriorId: profAnterior.id,
      professorAlvoId: professor.id,
      motivoTroca: "Cobertura de agenda",
      dataInicioPrevista: daysAhead(2, 8, 0),
      resumoHorarios: "Seg/Qua 08:00",
      status: "PENDENTE",
    },
  });

  await prisma.docenteDashboardConfig.upsert({
    where: { schoolId_role: { schoolId: school.id, role: "PROFESSOR" } },
    update: {
      minAttendancePercent: 80,
      minAttendanceSamples: 4,
      minGrade: 6.5,
      minGradeSamples: 2,
      weeklyCallsTarget: 8,
      weeklyAssessmentsTarget: 2,
      weeklyGradesTarget: 12,
    },
    create: {
      schoolId: school.id,
      role: "PROFESSOR",
      minAttendancePercent: 80,
      minAttendanceSamples: 4,
      minGrade: 6.5,
      minGradeSamples: 2,
      weeklyCallsTarget: 8,
      weeklyAssessmentsTarget: 2,
      weeklyGradesTarget: 12,
    },
  });

  console.log(
    JSON.stringify(
      {
        schoolId: school.id,
        userProfessorId: userProfessor.id,
        professorId: professor.id,
        turmaIds: [turmaA.id, turmaB.id],
        alunosCriados: alunos.length,
        matriculasCriadas: matriculas.length,
        avaliacoesCriadas: 2,
        eventosCriados: 2,
        materiaisCriados: 3,
        notificacoesCriadas: 2,
        trocasPendentesCriadas: 1,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
