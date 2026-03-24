import { NextRequest, NextResponse } from "next/server";
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const year = Number(searchParams.get("year") || new Date().getFullYear());
    const courseCategory = searchParams.get("category") || "all";

    const pagamentos = await prisma.pagamento.findMany({
      where: {
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
      include: {
        aluno: true,
        turma: {
          include: {
            curso: true,
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
        const updatedAt =
          "updatedAt" in m ? new Date((m as any).updatedAt) : null;
        return (
          m.status?.toUpperCase?.() === "CANCELADA" &&
          updatedAt &&
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
      (m) => m.status?.toUpperCase?.() !== "CANCELADA"
    ).length;

    const retentionRate =
      matriculas.length > 0 ? (activeMatriculas / matriculas.length) * 100 : 0;

    const paidCount = paidPayments.length;
    const totalPaidValue = paidPayments.reduce(
      (acc, p) => acc + Number(p.valor),
      0
    );
    const averageTicket = paidCount > 0 ? totalPaidValue / paidCount : 0;

    const metaMensal = 90000;
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar os relatórios." },
      { status: 500 }
    );
  }
}
