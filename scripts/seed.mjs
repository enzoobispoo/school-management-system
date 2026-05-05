import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida.");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

function phone(i) {
  return `119${String(900000000 + i).slice(0, 9)}`;
}
function cpf(i) {
  return String(10000000000 + i).slice(0, 11);
}
function addMonths(date, n) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}
function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}
function slug(name) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, ".");
}

async function main() {
  console.log("🚀 Iniciando seed...\n");

  // ── Usuário Admin ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@escola.com" },
    update: {},
    create: {
      email: "admin@escola.com",
      nome: "Administrador",
      passwordHash,
      role: "ADMIN",
      ativo: true,
    },
  });
  console.log(`✅ Admin criado: admin@escola.com / admin123`);

  // ── Escola ─────────────────────────────────────────────────────
  await prisma.escolaSettings.upsert({
    where: { id: "default" },
    update: { nomeEscola: "Centro de Formação Alpha", metaMensal: 15000 },
    create: { id: "default", nomeEscola: "Centro de Formação Alpha", metaMensal: 15000, diaVencimentoPadrao: 10 },
  });
  console.log("🏫 Escola configurada (meta mensal: R$ 15.000)\n");

  // ── Cursos ─────────────────────────────────────────────────────
  const cursosData = [
    { nome: "Inglês Intermediário", categoria: "Idiomas", valorMensal: "289.00", duracaoTexto: "10 meses" },
    { nome: "Espanhol Básico", categoria: "Idiomas", valorMensal: "249.00", duracaoTexto: "8 meses" },
    { nome: "Desenvolvimento Web Full Stack", categoria: "Tecnologia", valorMensal: "497.00", duracaoTexto: "12 meses" },
    { nome: "Robótica Educacional", categoria: "Tecnologia", valorMensal: "349.00", duracaoTexto: "8 meses" },
    { nome: "Informática Básica", categoria: "Tecnologia", valorMensal: "199.00", duracaoTexto: "6 meses" },
    { nome: "Violão para Iniciantes", categoria: "Música", valorMensal: "229.00", duracaoTexto: "12 meses" },
  ];

  const cursos = [];
  for (const c of cursosData) {
    const curso = await prisma.curso.upsert({
      where: { nome: c.nome },
      update: {},
      create: c,
    });
    cursos.push(curso);
  }
  console.log(`📚 ${cursos.length} cursos criados`);

  // ── Professores ────────────────────────────────────────────────
  const professoresData = [
    { nome: "Lucas Andrade", email: "lucas@escola.com", telefone: "11987654321" },
    { nome: "Mariana Costa", email: "mariana@escola.com", telefone: "11987654322" },
    { nome: "Rafael Lima", email: "rafael@escola.com", telefone: "11987654323" },
    { nome: "Patrícia Souza", email: "patricia@escola.com", telefone: "11987654324" },
  ];

  const professores = [];
  for (const p of professoresData) {
    const prof = await prisma.professor.upsert({
      where: { email: p.email },
      update: {},
      create: p,
    });
    professores.push(prof);
  }
  console.log(`👨‍🏫 ${professores.length} professores criados`);

  // ── Turmas ─────────────────────────────────────────────────────
  const turmasConfig = [
    { cursoIdx: 0, profIdx: 0, nome: "Turma Noite A", cap: 20, horarios: [{ diaSemana: "SEGUNDA", horaInicio: "19:00", horaFim: "21:00" }, { diaSemana: "QUARTA", horaInicio: "19:00", horaFim: "21:00" }] },
    { cursoIdx: 1, profIdx: 1, nome: "Turma Manhã", cap: 16, horarios: [{ diaSemana: "TERCA", horaInicio: "09:00", horaFim: "11:00" }, { diaSemana: "QUINTA", horaInicio: "09:00", horaFim: "11:00" }] },
    { cursoIdx: 2, profIdx: 2, nome: "Turma Tarde", cap: 18, horarios: [{ diaSemana: "SEGUNDA", horaInicio: "14:00", horaFim: "17:00" }, { diaSemana: "QUARTA", horaInicio: "14:00", horaFim: "17:00" }] },
    { cursoIdx: 3, profIdx: 3, nome: "Turma Sábado", cap: 15, horarios: [{ diaSemana: "SABADO", horaInicio: "09:00", horaFim: "12:00" }] },
    { cursoIdx: 4, profIdx: 0, nome: "Turma Noite B", cap: 20, horarios: [{ diaSemana: "TERCA", horaInicio: "19:00", horaFim: "21:00" }, { diaSemana: "QUINTA", horaInicio: "19:00", horaFim: "21:00" }] },
    { cursoIdx: 5, profIdx: 1, nome: "Turma Tarde", cap: 12, horarios: [{ diaSemana: "SEXTA", horaInicio: "15:00", horaFim: "17:00" }] },
  ];

  const turmas = [];
  for (const t of turmasConfig) {
    const turma = await prisma.turma.create({
      data: {
        cursoId: cursos[t.cursoIdx].id,
        professorId: professores[t.profIdx].id,
        nome: t.nome,
        capacidadeMaxima: t.cap,
        ativo: true,
        horarios: { create: t.horarios },
      },
    });
    turmas.push(turma);
  }
  console.log(`🏫 ${turmas.length} turmas criadas`);

  // ── Alunos ─────────────────────────────────────────────────────
  const alunosData = [
    { nome: "Ana Beatriz Rocha", status: "ATIVO", possuiLaudo: false },
    { nome: "Carlos Eduardo Nunes", status: "ATIVO", possuiLaudo: false },
    { nome: "Fernanda Lima", status: "ATIVO", possuiLaudo: true, laudoTipo: "TEA (Transtorno do Espectro Autista)", laudoCid: "F84.0", laudoNivel: "leve", adaptacaoNecessaria: true, adaptacaoDescricao: "Tempo extra nas avaliações" },
    { nome: "João Pedro Martins", status: "ATIVO", possuiLaudo: false },
    { nome: "Camila Oliveira", status: "ATIVO", possuiLaudo: false },
    { nome: "Matheus Souza", status: "TRANCADO", possuiLaudo: false, motivoSaida: "Viagem a trabalho", dataSaida: new Date() },
    { nome: "Larissa Gomes", status: "ATIVO", possuiLaudo: true, laudoTipo: "TDAH", laudoCid: "F90.0", laudoNivel: "moderado", medicamentos: "Ritalina 10mg às 8h" },
    { nome: "Bruno Carvalho", status: "ATIVO", possuiLaudo: false },
    { nome: "Juliana Ribeiro", status: "ATIVO", possuiLaudo: false },
    { nome: "Thiago Almeida", status: "INATIVO", possuiLaudo: false, motivoSaida: "Mudou de cidade" },
    { nome: "Beatriz Fernandes", status: "ATIVO", possuiLaudo: false },
    { nome: "Gabriel Mendes", status: "ATIVO", possuiLaudo: false },
    { nome: "Isabela Torres", status: "ATIVO", possuiLaudo: false },
    { nome: "Pedro Henrique Costa", status: "ATIVO", possuiLaudo: false },
    { nome: "Rafaela Nascimento", status: "ATIVO", possuiLaudo: false },
  ];

  const alunos = [];
  for (let i = 0; i < alunosData.length; i++) {
    const a = alunosData[i];
    const aluno = await prisma.aluno.create({
      data: {
        nome: a.nome,
        email: `${slug(a.nome)}@aluno.demo.com`,
        cpf: cpf(i + 1),
        telefone: phone(i + 1),
        responsavelNome: `Responsável de ${a.nome.split(" ")[0]}`,
        responsavelTelefone: phone(i + 101),
        endereco: `Rua das Flores, ${100 + i} - Centro, São Paulo - SP`,
        status: a.status,
        possuiLaudo: a.possuiLaudo ?? false,
        laudoTipo: a.laudoTipo ?? null,
        laudoCid: a.laudoCid ?? null,
        laudoNivel: a.laudoNivel ?? null,
        adaptacaoNecessaria: a.adaptacaoNecessaria ?? false,
        adaptacaoDescricao: a.adaptacaoDescricao ?? null,
        medicamentos: a.medicamentos ?? null,
        motivoSaida: a.motivoSaida ?? null,
        dataSaida: a.dataSaida ?? null,
        indicacao: i % 3 === 0 ? "Instagram" : i % 3 === 1 ? "Indicação de amigo" : "Google",
        nivelInicial: i % 2 === 0 ? "Iniciante" : "Intermediário",
      },
    });
    alunos.push(aluno);
  }
  console.log(`👨‍🎓 ${alunos.length} alunos criados`);

  // ── Matrículas ─────────────────────────────────────────────────
  const hoje = new Date();
  const matriculas = [];

  for (let i = 0; i < alunos.length; i++) {
    const aluno = alunos[i];
    if (aluno.status === "INATIVO") continue;

    const turma = turmas[i % turmas.length];
    const status = aluno.status === "TRANCADO" ? "TRANCADA" : "ATIVA";

    const matricula = await prisma.matricula.create({
      data: {
        alunoId: aluno.id,
        turmaId: turma.id,
        status,
        dataMatricula: addDays(hoje, -(Math.floor(Math.random() * 180) + 30)),
      },
      include: { turma: { include: { curso: true } } },
    });
    matriculas.push(matricula);
  }
  console.log(`📝 ${matriculas.length} matrículas criadas`);

  // ── Pagamentos (3 meses por matrícula ativa) ───────────────────
  let totalPagamentos = 0;
  for (const matricula of matriculas) {
    if (matricula.status !== "ATIVA") continue;
    const valor = matricula.turma.curso.valorMensal;

    const meses = [
      { offset: -2, status: "PAGO" },
      { offset: -1, status: "PAGO" },
      { offset: 0, status: "PENDENTE" },
    ];

    for (const m of meses) {
      const venc = addMonths(new Date(hoje.getFullYear(), hoje.getMonth(), 10), m.offset);
      await prisma.pagamento.create({
        data: {
          matriculaId: matricula.id,
          competenciaMes: venc.getMonth() + 1,
          competenciaAno: venc.getFullYear(),
          descricao: `Mensalidade - ${matricula.turma.curso.nome}`,
          valor,
          vencimento: venc,
          status: m.status,
          dataPagamento: m.status === "PAGO" ? addDays(venc, -2) : null,
          metodoPagamento: m.status === "PAGO" ? (Math.random() > 0.5 ? "PIX" : "Cartão") : null,
        },
      });
      totalPagamentos++;
    }

    // 1 pagamento atrasado para alguns alunos
    if (matriculas.indexOf(matricula) % 3 === 0) {
      const vencAtrasado = addMonths(new Date(hoje.getFullYear(), hoje.getMonth(), 10), -3);
      await prisma.pagamento.create({
        data: {
          matriculaId: matricula.id,
          competenciaMes: vencAtrasado.getMonth() + 1,
          competenciaAno: vencAtrasado.getFullYear(),
          descricao: `Mensalidade - ${matricula.turma.curso.nome}`,
          valor,
          vencimento: vencAtrasado,
          status: "ATRASADO",
          dataPagamento: null,
        },
      });
      totalPagamentos++;
    }
  }
  console.log(`💳 ${totalPagamentos} pagamentos criados`);

  // ── Eventos ────────────────────────────────────────────────────
  const eventosData = [
    { titulo: "Palestra: Carreira em Tecnologia", tipo: "REUNIAO", offset: 3, cursoIdx: 2, profIdx: 2, turmaIdx: 2, local: "Auditório Principal" },
    { titulo: "Avaliação Prática — Inglês", tipo: "PROVA", offset: 5, cursoIdx: 0, profIdx: 0, turmaIdx: 0, local: "Sala 01" },
    { titulo: "Reunião Pedagógica", tipo: "REUNIAO", offset: 1, cursoIdx: null, profIdx: 1, turmaIdx: null, local: "Sala de Reuniões" },
    { titulo: "Reposição de Aula — Robótica", tipo: "REPOSICAO", offset: 7, cursoIdx: 3, profIdx: 3, turmaIdx: 3, local: "Lab de Robótica" },
    { titulo: "Recesso de Julho", tipo: "FERIADO", offset: 14, cursoIdx: null, profIdx: null, turmaIdx: null, local: null },
  ];

  for (const e of eventosData) {
    const inicio = addDays(hoje, e.offset);
    inicio.setHours(19, 0, 0, 0);
    const fim = new Date(inicio);
    fim.setHours(21, 0, 0, 0);

    await prisma.evento.create({
      data: {
        titulo: e.titulo,
        tipo: e.tipo,
        dataInicio: inicio,
        dataFim: fim,
        local: e.local,
        ativo: true,
        cor: "#111111",
        cursoId: e.cursoIdx !== null ? cursos[e.cursoIdx].id : null,
        professorId: e.profIdx !== null ? professores[e.profIdx].id : null,
        turmaId: e.turmaIdx !== null ? turmas[e.turmaIdx].id : null,
      },
    });
  }
  console.log(`📅 ${eventosData.length} eventos criados`);

  // ── Notificações ───────────────────────────────────────────────
  await prisma.notificacao.createMany({
    data: [
      { tipo: "NOVO_ALUNO", titulo: "Novo aluno cadastrado", mensagem: "Ana Beatriz Rocha foi cadastrada.", entidadeTipo: "ALUNO" },
      { tipo: "PAGAMENTO_ATRASADO", titulo: "Pagamentos em atraso", mensagem: "Há mensalidades vencidas aguardando regularização.", entidadeTipo: "PAGAMENTO" },
      { tipo: "SISTEMA", titulo: "Seed concluído", mensagem: "Dados de demonstração criados com sucesso.", entidadeTipo: "SISTEMA" },
    ],
  });

  console.log("\n✅ Seed concluído com sucesso!\n");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Login: admin@escola.com");
  console.log("  Senha: admin123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
}

main()
  .catch((e) => { console.error("❌ Erro:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
