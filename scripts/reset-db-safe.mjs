import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

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

  // ORDEM IMPORTA (por causa de FK)
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

  console.log("🧹 Dados apagados");

  // (opcional) resetar config da escola
  await prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nome: "EduGestão",
    },
  });

  console.log("🏫 Escola resetada");

  console.log("🚀 Banco limpo com sucesso (usuário preservado)");
}

main().finally(() => prisma.$disconnect());