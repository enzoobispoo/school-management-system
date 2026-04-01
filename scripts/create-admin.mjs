import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL não foi definida.");
}

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ["warn", "error"],
});

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const nome = process.argv[4] || "Administrador";

  if (!email || !password) {
    console.error(
      'Uso: node scripts/create-admin.mjs "admin@empresa.com" "Senha123" "Nome do Admin"'
    );
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: email.toLowerCase() },
    update: {
      nome,
      passwordHash,
      ativo: true,
      role: "ADMIN",
    },
    create: {
      nome,
      email: email.toLowerCase(),
      passwordHash,
      ativo: true,
      role: "ADMIN",
    },
  });

  console.log("Usuário admin criado/atualizado com sucesso:");
  console.log({
    id: user.id,
    nome: user.nome,
    email: user.email,
    role: user.role,
  });
}

main()
  .catch((error) => {
    console.error("Erro ao criar admin:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });