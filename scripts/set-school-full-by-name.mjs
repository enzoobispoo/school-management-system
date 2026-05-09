/**
 * Uso: node scripts/set-school-full-by-name.mjs [termo]
 * Carrega .env.local e .env; atualiza School.plano para "full" quando:
 * - existe User com nome contendo o termo (case insensitive), ou
 * - existe School com nome contendo o termo.
 *
 * Exemplo: node scripts/set-school-full-by-name.mjs maria
 */
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

config({ path: ".env.local" });
config({ path: ".env" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não encontrada (.env.local ou .env).");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
  log: ["warn", "error"],
});

const term = (process.argv[2] || "maria").trim();
if (!term) {
  console.error("Informe um termo, ex.: maria");
  process.exit(1);
}

const users = await prisma.user.findMany({
  where: {
    schoolId: { not: null },
    nome: { contains: term, mode: "insensitive" },
  },
  select: { schoolId: true, nome: true, email: true },
});

const schoolsByName = await prisma.school.findMany({
  where: { nome: { contains: term, mode: "insensitive" } },
  select: { id: true, nome: true, plano: true, slug: true },
});

/** @type {Set<string>} */
const ids = new Set();
for (const u of users) {
  if (u.schoolId) ids.add(u.schoolId);
}
for (const s of schoolsByName) ids.add(s.id);

if (ids.size === 0) {
  console.log(`Nenhuma escola encontrada (usuário ou nome da escola) para "${term}".`);
  process.exit(1);
}

console.log(
  `Encontrado(s) ${ids.size} tenant(s). Usuários com nome ~"${term}":`,
  users.map((u) => `${u.nome} <${u.email}>`).join(", ") || "(nenhum)",
);

for (const id of ids) {
  const s = await prisma.school.update({
    where: { id },
    data: { plano: "full" },
    select: { nome: true, slug: true, plano: true },
  });
  console.log(`✓ ${s.nome} (${s.slug}) → plano "${s.plano}"`);
}

await prisma.$disconnect();
await pool.end();
