import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não foi definida.");
}

if (process.env.NODE_ENV === "production") {
  throw new Error("Este script não pode ser executado em produção.");
}

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

const EMAIL_TO_KEEP = process.argv[2];

if (!EMAIL_TO_KEEP) {
  console.log(
    'Use: node scripts/reset-and-seed-demo.mjs "seuemail@teste.com"'
  );
  process.exit(1);
}

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function addDays(baseDate, days) {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return date;
}

function monthYearFromDate(date) {
  return {
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
  };
}

function formatPhone(index) {
  const base = String(900000000 + index).slice(0, 9);
  return `119${base}`;
}

function formatCPF(index) {
  const value = String(10000000000 + index).slice(0, 11);
  return value;
}

function createPaymentStatusByOffset(offsetDays) {
  if (offsetDays < 0) return "ATRASADO";
  if (offsetDays === 0) return "PENDENTE";
  return "PENDENTE";
}

async function main() {
  console.log("🔄 Limpando banco e recriando demo...");

  const user = await prisma.user.findUnique({
    where: { email: EMAIL_TO_KEEP.toLowerCase() },
  });

  if (!user) {
    console.log("❌ Usuário preservado não encontrado.");
    process.exit(1);
  }

  console.log(`Mantendo usuário: ${user.email}`);

  await prisma.notificacao.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.turmaHorario.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.userInvite.deleteMany();

  await prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {
      nome: "Centro de Formação Alpha",
    },
    create: {
      id: "default",
      nome: "Centro de Formação Alpha",
    },
  });

  console.log("🏫 Escola configurada.");

  const cursosData = [
    {
      nome: "Desenvolvimento Full Stack com React e Next.js",
      categoria: "Tecnologia",
      descricao:
        "Formação prática em desenvolvimento web moderno com foco em projetos reais.",
      duracaoTexto: "12 meses",
      valorMensal: "497.00",
    },
    {
      nome: "Inglês para Comunicação Profissional",
      categoria: "Idiomas",
      descricao:
        "Curso voltado para fluência em contextos profissionais e atendimento.",
      duracaoTexto: "10 meses",
      valorMensal: "289.00",
    },
    {
      nome: "Robótica Educacional Kids",
      categoria: "Tecnologia",
      descricao:
        "Introdução à lógica, montagem e programação para crianças e adolescentes.",
      duracaoTexto: "8 meses",
      valorMensal: "349.00",
    },
    {
      nome: "Informática Aplicada ao Mercado de Trabalho",
      categoria: "Tecnologia",
      descricao:
        "Pacote office, organização digital e produtividade para o dia a dia profissional.",
      duracaoTexto: "6 meses",
      valorMensal: "229.00",
    },
  ];

  const professoresData = [
    {
      nome: "Lucas Andrade",
      email: "lucas.andrade@demo.com",
      telefone: "11987654321",
    },
    {
      nome: "Mariana Costa",
      email: "mariana.costa@demo.com",
      telefone: "11987654322",
    },
    {
      nome: "Rafael Lima",
      email: "rafael.lima@demo.com",
      telefone: "11987654323",
    },
    {
      nome: "Patrícia Souza",
      email: "patricia.souza@demo.com",
      telefone: "11987654324",
    },
  ];

  const cursos = [];
  for (const curso of cursosData) {
    const created = await prisma.curso.create({
      data: curso,
    });
    cursos.push(created);
  }

  const professores = [];
  for (const professor of professoresData) {
    const created = await prisma.professor.create({
      data: professor,
    });
    professores.push(created);
  }

  console.log("Cursos e professores criados.");

  const turmaTemplates = [
    {
      nome: "Turma Noite",
      capacidadeMaxima: 20,
      horarios: [
        { diaSemana: "SEGUNDA", horaInicio: "19:00", horaFim: "21:00" },
        { diaSemana: "QUARTA", horaInicio: "19:00", horaFim: "21:00" },
      ],
    },
    {
      nome: "Turma Sábado",
      capacidadeMaxima: 16,
      horarios: [
        { diaSemana: "SABADO", horaInicio: "09:00", horaFim: "12:00" },
      ],
    },
    {
      nome: "Turma Tarde",
      capacidadeMaxima: 18,
      horarios: [
        { diaSemana: "TERCA", horaInicio: "14:00", horaFim: "16:00" },
        { diaSemana: "QUINTA", horaInicio: "14:00", horaFim: "16:00" },
      ],
    },
  ];

  const turmas = [];

  for (let i = 0; i < cursos.length; i++) {
    const curso = cursos[i];
    const professor = professores[i % professores.length];
    const template = turmaTemplates[i % turmaTemplates.length];

    const turma = await prisma.turma.create({
      data: {
        cursoId: curso.id,
        professorId: professor.id,
        nome: template.nome,
        capacidadeMaxima: template.capacidadeMaxima,
        ativo: true,
        horarios: {
          create: template.horarios,
        },
      },
      include: {
        curso: true,
        professor: true,
        horarios: true,
      },
    });

    turmas.push(turma);
  }

  console.log("Turmas e horários criados.");

  const alunosData = [
    "Enzo Bispo",
    "Ana Beatriz Rocha",
    "Carlos Eduardo Nunes",
    "Fernanda Lima",
    "João Pedro Martins",
    "Camila Oliveira",
    "Matheus Souza",
    "Larissa Gomes",
    "Bruno Carvalho",
    "Juliana Ribeiro",
    "Thiago Almeida",
    "Beatriz Fernandes",
  ];

  const alunos = [];

  for (let i = 0; i < alunosData.length; i++) {
    const nome = alunosData[i];
    const emailSlug = nome
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, ".");

    const aluno = await prisma.aluno.create({
      data: {
        nome,
        email: `${emailSlug}@aluno.demo.com`,
        cpf: formatCPF(i + 1),
        telefone: formatPhone(i + 1),
        endereco: `Rua Exemplo, ${100 + i} - Centro, São Paulo - SP`,
        status: "ATIVO",
      },
    });

    alunos.push(aluno);
  }

  console.log("Alunos criados.");

  const matriculas = [];

  for (let i = 0; i < alunos.length; i++) {
    const aluno = alunos[i];
    const turma = turmas[i % turmas.length];

    const matricula = await prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        turmaId: turma.id,
        status: "ATIVA",
        observacoes: i % 4 === 0 ? "Aluno com ótimo desempenho." : null,
      },
      include: {
        aluno: true,
        turma: {
          include: {
            curso: true,
          },
        },
      },
    });

    matriculas.push(matricula);
  }

  console.log("Matrículas criadas.");

  const hoje = new Date();

  for (let i = 0; i < matriculas.length; i++) {
    const matricula = matriculas[i];
    const valorMensal = matricula.turma.curso.valorMensal;
  
    const paymentTemplates = [
      { monthOffset: -1, status: "PAGO" },
      { monthOffset: 0, status: "PENDENTE" },
      { monthOffset: -2, status: "ATRASADO" },
    ];
  
    for (const template of paymentTemplates) {
      const vencimento = new Date(
        hoje.getFullYear(),
        hoje.getMonth() + template.monthOffset,
        10,
        12,
        0,
        0
      );
  
      const competenciaMes = vencimento.getMonth() + 1;
      const competenciaAno = vencimento.getFullYear();
  
      const dataPagamento =
        template.status === "PAGO"
          ? new Date(
              vencimento.getFullYear(),
              vencimento.getMonth(),
              9,
              12,
              0,
              0
            )
          : null;
  
      await prisma.pagamento.create({
        data: {
          matriculaId: matricula.id,
          competenciaMes,
          competenciaAno,
          descricao: `Mensalidade - ${matricula.turma.curso.nome}`,
          valor: valorMensal,
          vencimento,
          dataPagamento,
          status: template.status,
          metodoPagamento: dataPagamento ? "PIX" : null,
          observacoes:
            template.status === "ATRASADO"
              ? "Pagamento em atraso - lembrete pendente."
              : null,
        },
      });
    }
  }

  console.log("Pagamentos criados.");

  const eventosData = [
    {
      titulo: "Palestra: Carreira em Desenvolvimento Web",
      descricao:
        "Encontro com foco em mercado de trabalho, portfólio e oportunidades na área de tecnologia.",
      tipo: "REUNIAO",
      dataInicio: addDays(hoje, 2),
      dataFim: addDays(hoje, 2),
      local: "Auditório Principal - Unidade Centro",
      cursoId: cursos[0]?.id ?? null,
      professorId: professores[0]?.id ?? null,
      turmaId: turmas[0]?.id ?? null,
    },
    {
      titulo: "Avaliação Prática de React",
      descricao:
        "Avaliação prática do módulo atual com desenvolvimento de interface e integração de dados.",
      tipo: "PROVA",
      dataInicio: addDays(hoje, 4),
      dataFim: addDays(hoje, 4),
      local: "Laboratório 02",
      cursoId: cursos[0]?.id ?? null,
      professorId: professores[0]?.id ?? null,
      turmaId: turmas[0]?.id ?? null,
    },
    {
      titulo: "Reunião Pedagógica Semanal",
      descricao:
        "Alinhamento interno entre coordenação e professores sobre turmas e desempenho.",
      tipo: "REUNIAO",
      dataInicio: addDays(hoje, 1),
      dataFim: addDays(hoje, 1),
      local: "Sala de Reuniões",
      cursoId: null,
      professorId: professores[1]?.id ?? null,
      turmaId: null,
    },
  ];

  for (const evento of eventosData) {
    const baseDate = evento.dataInicio;
    const inicio = new Date(baseDate);
    inicio.setHours(19, 0, 0, 0);

    const fim = new Date(baseDate);
    fim.setHours(21, 0, 0, 0);

    await prisma.evento.create({
      data: {
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        dataInicio: inicio,
        dataFim: fim,
        local: evento.local,
        cursoId: evento.cursoId,
        professorId: evento.professorId,
        turmaId: evento.turmaId,
        ativo: true,
        cor: "#111111",
      },
    });
  }

  console.log("Eventos criados.");

  await prisma.notificacao.createMany({
    data: [
      {
        tipo: "NOVO_ALUNO",
        titulo: "Novo aluno matriculado",
        mensagem: "Ana Beatriz Rocha foi cadastrada no sistema.",
        entidadeTipo: "ALUNO",
      },
      {
        tipo: "PAGAMENTO_ATRASADO",
        titulo: "Pagamento em atraso",
        mensagem: "Há pagamentos vencidos aguardando regularização.",
        entidadeTipo: "PAGAMENTO",
      },
      {
        tipo: "SISTEMA",
        titulo: "Base demo preparada",
        mensagem: "Os dados de demonstração foram criados com sucesso.",
        entidadeTipo: "SISTEMA",
      },
    ],
  });

  console.log("Notificações criadas.");
  console.log("Demo pronta com sucesso.");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao resetar e popular demo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });