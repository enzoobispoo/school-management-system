/**
 * Garante os planos no catálogo (upsert por slug).
 * Inclui um plano "Teste" para escolas / convites de homologação.
 *
 * Uso: npm run db:seed-plans
 * Requer DATABASE_URL no .env
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL não definida.");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

/** Mesmos ids da migration `20260413000000_add_plans_subscriptions` + plano teste */
const PLANS = [
  {
    id: "plan_starter",
    nome: "Starter",
    slug: "starter",
    preco: 97,
    descricao: "Ideal para escolas pequenas",
    limiteAlunos: 50,
    limiteTurmas: 5,
    limiteUsuarios: 3,
  },
  {
    id: "plan_pro",
    nome: "Pro",
    slug: "pro",
    preco: 197,
    descricao: "Para escolas em crescimento",
    limiteAlunos: 200,
    limiteTurmas: 20,
    limiteUsuarios: 10,
  },
  {
    id: "plan_premium",
    nome: "Premium",
    slug: "premium",
    preco: 397,
    descricao: "Sem limites operacionais",
    limiteAlunos: null,
    limiteTurmas: null,
    limiteUsuarios: null,
  },
  {
    id: "plan_teste",
    nome: "Teste",
    slug: "teste",
    preco: 0,
    descricao: "Homologação e escolas de teste",
    limiteAlunos: 100,
    limiteTurmas: 20,
    limiteUsuarios: 10,
  },
];

async function main() {
  for (const p of PLANS) {
    await prisma.plan.upsert({
      where: { slug: p.slug },
      update: {
        nome: p.nome,
        preco: p.preco,
        descricao: p.descricao,
        limiteAlunos: p.limiteAlunos,
        limiteTurmas: p.limiteTurmas,
        limiteUsuarios: p.limiteUsuarios,
        ativo: true,
      },
      create: {
        id: p.id,
        nome: p.nome,
        slug: p.slug,
        preco: p.preco,
        descricao: p.descricao,
        limiteAlunos: p.limiteAlunos,
        limiteTurmas: p.limiteTurmas,
        limiteUsuarios: p.limiteUsuarios,
        ativo: true,
      },
    });
    console.log(`✓ ${p.nome} (${p.slug})`);
  }
  console.log("\nPlanos atualizados. Use o plano «Teste» nos convites das escolas de teste.\n");
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
