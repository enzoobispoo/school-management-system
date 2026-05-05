import { prisma } from "@/lib/prisma";

export async function getOrCreateSchoolSetting(schoolId: string) {
  return prisma.escolaSettings.upsert({
    where: { schoolId },
    update: {},
    create: {
      id: schoolId,
      schoolId,
      nomeEscola: "Minha Escola",
    },
  });
}
