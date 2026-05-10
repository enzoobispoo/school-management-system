import "server-only";

import { prisma } from "@/lib/prisma";

function monthLabel(month: number) {
  const labels = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return labels[month - 1] ?? String(month);
}

export type BuildSchoolFinanceReportParams = {
  schoolId: string;
  year: number;
  courseCategory?: string;
};

/**
 * Agrega dados do painel de relatórios financeiros por escola (multi-tenant).
 * Substitui o uso incorreto de `escolaSettings.id === "default"` do endpoint legado.
 */
export async function buildSchoolFinanceReport(
  params: BuildSchoolFinanceReportParams
) {
  const { schoolId, year } = params;
  const courseCategory = params.courseCategory ?? "all";

  const pagamentos = await prisma.pagamento.findMany({
    where: {
      schoolId,
      status: {
        in: ["PAGO", "PENDENTE", "ATRASADO"],
      },
      ...(courseCategory !== "all"
        ? {
            matricula: {
              turma: {
                curso: {
                  categoria: courseCategory,
                },
              },
            },
          }
        : {}),
    },
    include: {
      matricula: {
        include: {
          aluno: true,
          turma: {
            include: {
              curso: true,
            },
          },
        },
      },
    },
  });

  const matriculas = await prisma.matricula.findMany({
    where: {
      schoolId,
      ...(courseCategory !== "all"
        ? {
            turma: {
              curso: {
                categoria: courseCategory,
              },
            },
          }
        : {}),
    },
    select: {
      status: true,
      dataMatricula: true,
      updatedAt: true,
      turma: {
        select: {
          curso: {
            select: { nome: true },
          },
        },
      },
    },
  });

  const paidPayments = pagamentos.filter((p) => p.status === "PAGO");
  const paidThisYear = paidPayments.filter((p) => p.competenciaAno === year);
  const paidPrevYear = paidPayments.filter(
    (p) => p.competenciaAno === year - 1
  );

  const revenueCurrent = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const total = paidThisYear
      .filter((p) => p.competenciaMes === month)
      .reduce((acc, p) => acc + Number(p.valor), 0);

    return {
      month: monthLabel(month),
      atual: total,
    };
  });

  const revenuePrevious = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const total = paidPrevYear
      .filter((p) => p.competenciaMes === month)
      .reduce((acc, p) => acc + Number(p.valor), 0);

    return {
      month: monthLabel(month),
      anterior: total,
    };
  });

  const revenueEvolution = revenueCurrent.map((item, index) => ({
    month: item.month,
    atual: item.atual,
    anterior: revenuePrevious[index]?.anterior ?? 0,
  }));

  const studentsGrowth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;

    const novos = matriculas.filter((m) => {
      const date = new Date(m.dataMatricula);
      return date.getFullYear() === year && date.getMonth() + 1 === month;
    }).length;

    const cancelados = matriculas.filter((m) => {
      const updatedAt = new Date(m.updatedAt);
      return (
        m.status === "CANCELADA" &&
        updatedAt.getFullYear() === year &&
        updatedAt.getMonth() + 1 === month
      );
    }).length;

    return {
      month: monthLabel(month),
      novos,
      cancelados,
    };
  });

  const coursesMap = new Map<string, { name: string; students: number }>();

  for (const matricula of matriculas) {
    const courseName = matricula.turma.curso.nome;
    const current = coursesMap.get(courseName);

    if (current) {
      current.students += 1;
    } else {
      coursesMap.set(courseName, {
        name: courseName,
        students: 1,
      });
    }
  }

  const popularCoursesBase = Array.from(coursesMap.values()).sort(
    (a, b) => b.students - a.students
  );

  const maxStudents = popularCoursesBase[0]?.students || 1;

  const popularCourses = popularCoursesBase.map((course) => ({
    name: course.name,
    students: course.students,
    percentage: Math.round((course.students / maxStudents) * 100),
  }));

  const totalStudentsCurrentYear = matriculas.filter((m) => {
    const date = new Date(m.dataMatricula);
    return date.getFullYear() === year;
  }).length;

  const totalStudentsPrevYear = matriculas.filter((m) => {
    const date = new Date(m.dataMatricula);
    return date.getFullYear() === year - 1;
  }).length;

  const annualGrowth =
    totalStudentsPrevYear > 0
      ? ((totalStudentsCurrentYear - totalStudentsPrevYear) /
          totalStudentsPrevYear) *
        100
      : 0;

  const activeMatriculas = matriculas.filter(
    (m) => m.status !== "CANCELADA"
  ).length;

  const retentionRate =
    matriculas.length > 0 ? (activeMatriculas / matriculas.length) * 100 : 0;

  const paidCount = paidPayments.length;
  const totalPaidValue = paidPayments.reduce(
    (acc, p) => acc + Number(p.valor),
    0
  );
  const averageTicket = paidCount > 0 ? totalPaidValue / paidCount : 0;

  const settings = await prisma.escolaSettings.findUnique({
    where: { schoolId },
    select: { metaMensal: true },
  });
  const metaMensal = settings?.metaMensal ? Number(settings.metaMensal) : 0;

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const monthlyReceived = paidPayments
    .filter(
      (p) =>
        p.competenciaAno === currentYear &&
        p.competenciaMes === currentMonth
    )
    .reduce((acc, p) => acc + Number(p.valor), 0);

  const monthlyGoalRate =
    metaMensal > 0 ? (monthlyReceived / metaMensal) * 100 : 0;

  return {
    insights: {
      annualGrowth,
      retentionRate,
      averageTicket,
      monthlyGoalRate,
      monthlyReceived,
      monthlyGoalTarget: metaMensal,
    },
    revenueEvolution,
    studentsGrowth,
    popularCourses,
    meta: { schoolId, year, courseCategory },
  };
}
