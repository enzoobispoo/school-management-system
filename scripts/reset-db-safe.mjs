import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL não foi definida em .env.local");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const EMAIL_TO_KEEP = process.argv[2];

if (!EMAIL_TO_KEEP) {
  console.log("Use: node scripts/reset-db-safe.mjs seuemail@teste.com");
  process.exit(1);
}

async function main() {
  console.log("🔄 Resetando banco (mantendo usuário)...");

  const user = await prisma.user.findUnique({
    where: { email: EMAIL_TO_KEEP },
  });

  if (!user) {
    console.log("❌ Usuário não encontrado.");
    process.exit(1);
  }

  console.log("✅ Usuário preservado:", user.email);

  await prisma.notificacao.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.turmaHorario.deleteMany();
  await prisma.evento.deleteMany();
  await prisma.turmaProfessorHistorico.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.professorCurso.deleteMany();
  await prisma.professor.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.aluno.deleteMany();
  await prisma.userInvite.deleteMany();
  await prisma.cobrancaLote.deleteMany();

  console.log("🧹 Dados apagados");

  await prisma.escolaSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nomeEscola: "EduGestão",
    },
  });

  console.log("🏫 Configurações da escola preservadas/resetadas");
  console.log("🚀 Banco limpo com sucesso (usuário preservado)");
}

main()
  .catch((error) => {
    console.error("❌ Erro ao resetar banco:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });