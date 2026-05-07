import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const professorId = process.argv[2];
if (!professorId) {
  throw new Error("Uso: node scripts/verify-docente-scenario.mjs <professorId>");
}

const pool = new pg.Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 1,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

try {
  const professor = await prisma.professor.findUnique({
    where: { id: professorId },
    select: { id: true, nome: true, schoolId: true },
  });
  if (!professor) throw new Error("Professor não encontrado.");

  const [turmaCount, alunosAtivos, avalCount, eventoCount, aulaCount, materialCount, trocasPend, notif] =
    await Promise.all([
      prisma.turma.count({
        where: { schoolId: professor.schoolId, professorId: professor.id, ativo: true },
      }),
      prisma.matricula.count({
        where: { schoolId: professor.schoolId, status: "ATIVA", turma: { professorId: professor.id } },
      }),
      prisma.avaliacao.count({ where: { schoolId: professor.schoolId, professorId: professor.id } }),
      prisma.evento.count({ where: { schoolId: professor.schoolId, professorId: professor.id, ativo: true } }),
      prisma.aulaRegistro.count({ where: { schoolId: professor.schoolId, turma: { professorId: professor.id } } }),
      prisma.materialDidatico.count({ where: { schoolId: professor.schoolId, professorId: professor.id } }),
      prisma.trocaProfessorProposta.count({
        where: { schoolId: professor.schoolId, professorAlvoId: professor.id, status: "PENDENTE" },
      }),
      prisma.notificacao.count({
        where: {
          schoolId: professor.schoolId,
          OR: [{ destinatarioProfessorId: null }, { destinatarioProfessorId: professor.id }],
        },
      }),
    ]);

  console.log(
    JSON.stringify(
      {
        professor,
        turmaCount,
        alunosAtivos,
        avalCount,
        eventoCount,
        aulaCount,
        materialCount,
        trocasPend,
        notificacoesVisiveisPotenciais: notif,
      },
      null,
      2
    )
  );
} finally {
  await prisma.$disconnect();
  await pool.end();
}
