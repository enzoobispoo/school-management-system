import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { prisma } from "../lib/prisma";

async function resetData() {
  console.log("🧹 Limpando banco...");

  await prisma.notificacao.deleteMany();
  await prisma.pagamento.deleteMany();
  await prisma.matricula.deleteMany();
  await prisma.turma.deleteMany();
  await prisma.curso.deleteMany();
  await prisma.aluno.deleteMany();

  console.log("✅ Dados limpos com sucesso!");
}

resetData()
  .catch((e) => {
    console.error("❌ Erro ao limpar:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });