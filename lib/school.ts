import { prisma } from "@/lib/prisma";

export async function getOrCreateSchoolSetting() {
  return prisma.schoolSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      nome: "EduGestão",
    },
  });
}