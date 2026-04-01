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

const email = process.argv[2];

if (!email) {
  console.log("Use: node scripts/make-super-admin.mjs email@teste.com");
  process.exit(1);
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log("Usuário não encontrado.");
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "SUPER_ADMIN",
    },
  });

  console.log("Usuário atualizado para SUPER_ADMIN 🚀");
}

main().finally(() => prisma.$disconnect());