import dotenv from "dotenv";
dotenv.config({ path: ".env" });
dotenv.config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL não definida.");

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter, log: ["warn", "error"] });

const DEMO_EMAIL = "aluno.demo.tudo@seed.local";
const PROF_EMAIL = "seed.demo.professor@local.invalid";
const CURSO_NOME = "[Seed Demo] Ensino Regular — Completo";
const TURMA_NOME = "[Seed Demo] Turma Alfa";

async function main() {
  const schoolId = process.env.DEMO_SCHOOL_ID?.trim();

  const alunoWhere = schoolId
    ? { schoolId, email: DEMO_EMAIL }
    : { email: DEMO_EMAIL };
  const turmaWhere = schoolId
    ? { schoolId, nome: TURMA_NOME }
    : { nome: TURMA_NOME };
  const cursoWhere = schoolId
    ? { schoolId, nome: CURSO_NOME }
    : { nome: CURSO_NOME };
  const profWhere = schoolId
    ? { schoolId, email: PROF_EMAIL }
    : { email: PROF_EMAIL };

  await prisma.aluno.deleteMany({ where: alunoWhere });
  await prisma.turma.deleteMany({ where: turmaWhere });
  await prisma.curso.deleteMany({ where: cursoWhere });
  await prisma.professor.deleteMany({ where: profWhere });

  console.log("Demo removido com sucesso.");
}

main()
  .catch((e) => {
    console.error("Erro ao limpar demo:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
