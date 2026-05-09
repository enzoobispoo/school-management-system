import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromRequest } from "@/lib/auth/current-user";
import { jsWeekdayToDiaSemana, labelDiaSemana } from "@/lib/docente/dia-semana";
import { buildScopedNotificationWhere } from "@/lib/notificacoes/scoped-notification-where";
import {
  DOCENTE_DASHBOARD_DEFAULTS,
  normalizeDocenteDashboardConfig,
} from "@/lib/docente/dashboard-config";
import { API_FORBIDDEN_PROFILE } from "@/lib/http/api-forbidden";
import { blockProfessorWhenPortalDisabled } from "@/lib/docente/professor-portal-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday() {
  const d = startOfToday();
  d.setHours(23, 59, 59, 999);
  return d;
}

function startOfWeekMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeekMonday(date: Date) {
  const d = startOfWeekMonday(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

function parseHourToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function thirtyDaysAgo(from: Date) {
  return new Date(from.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    if (user.role !== "PROFESSOR") {
      return NextResponse.json({ error: API_FORBIDDEN_PROFILE }, { status: 403 });
    }
    if (!user.schoolId || !user.professorId) {
      return NextResponse.json(
        { error: "Professor não vinculado à escola." },
        { status: 403 }
      );
    }

    const portalDenied = await blockProfessorWhenPortalDisabled(user);
    if (portalDenied) return portalDenied;

    const schoolId = user.schoolId;
    const professorId = user.professorId;
    const schoolConfig = await prisma.docenteDashboardConfig.findUnique({
      where: {
        schoolId_role: {
          schoolId,
          role: "PROFESSOR",
        },
      },
    });
    const schoolBaseConfig = normalizeDocenteDashboardConfig(
      schoolConfig
        ? {
            minAttendancePercent: schoolConfig.minAttendancePercent,
            minAttendanceSamples: schoolConfig.minAttendanceSamples,
            minGrade: Number(schoolConfig.minGrade),
            minGradeSamples: schoolConfig.minGradeSamples,
            weeklyCallsTarget: schoolConfig.weeklyCallsTarget ?? undefined,
            weeklyAssessmentsTarget: schoolConfig.weeklyAssessmentsTarget ?? undefined,
            weeklyGradesTarget: schoolConfig.weeklyGradesTarget ?? undefined,
          }
        : DOCENTE_DASHBOARD_DEFAULTS
    );
    const queryNumber = (name: string) => {
      const raw = request.nextUrl.searchParams.get(name);
      if (raw === null || raw.trim() === "") return undefined;
      const num = Number(raw);
      return Number.isFinite(num) ? num : undefined;
    };
    const profileOverride = normalizeDocenteDashboardConfig(
      {
        minAttendancePercent: queryNumber("minAttendancePercent"),
        minAttendanceSamples: queryNumber("minAttendanceSamples"),
        minGrade: queryNumber("minGrade"),
        minGradeSamples: queryNumber("minGradeSamples"),
        weeklyCallsTarget: queryNumber("weeklyCallsTarget"),
        weeklyAssessmentsTarget: queryNumber("weeklyAssessmentsTarget"),
        weeklyGradesTarget: queryNumber("weeklyGradesTarget"),
      },
      schoolBaseConfig
    );
    const todayStart = startOfToday();
    const todayEnd = endOfToday();
    const now = new Date();
    const weekStart = startOfWeekMonday(now);
    const weekEnd = endOfWeekMonday(now);
    const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 24 * 60 * 60 * 1000);
    const twentyEightDaysAgo = new Date(todayStart.getTime() - 28 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(todayStart.getTime() - 60 * 24 * 60 * 60 * 1000);
    const diaHoje = jsWeekdayToDiaSemana();
    const notificationWhere = await buildScopedNotificationWhere({
      schoolId,
      role: "PROFESSOR",
      professorId,
      userId: user.id,
    });

    const turmas = await prisma.turma.findMany({
      where: {
        schoolId,
        professorId,
        ativo: true,
      },
      select: {
        id: true,
        nome: true,
        curso: { select: { nome: true } },
        horarios: {
          select: {
            diaSemana: true,
            horaInicio: true,
            horaFim: true,
          },
        },
      },
      orderBy: { nome: "asc" },
    });

    const turmaIds = turmas.map((t) => t.id);
    if (turmaIds.length === 0) {
      return NextResponse.json({
        pendenciasDia: {
          chamadasParaFechar: 0,
          avaliacoesSemNota: 0,
          trocasPendentes: 0,
        },
        proximaAula: null,
        lancamentosRecentes: [],
        alertasPedagogicos: [],
        checklistSemanal: {
          chamadas: { concluidas: 0, total: profileOverride.weeklyCallsTarget },
          avaliacoes: { concluidas: 0, total: profileOverride.weeklyAssessmentsTarget },
          notas: { concluidas: 0, total: profileOverride.weeklyGradesTarget },
        },
        filaAcoes: [],
        inboxPedagogica: [],
        resumoTurmas: [],
        metasPorDisciplina: [],
        agendaDidatica: null,
        relatorioSemanal: {
          resumo: "Sem turmas ativas no momento.",
          prioridades: [],
        },
        configAplicada: profileOverride,
      });
    }

    const [
      trocasPendentes,
      aulasHoje,
      avaliacoesComNotas,
      matriculasAtivas,
      avaliacoesRecentes,
      aulasRecentes,
      notasRecentes,
      presencas30d,
      notas60d,
      aulasSemana,
      avaliacoesSemana,
      notasSemana,
      presencas28dPorTurma,
      notas60dPorTurma,
      inboxPedagogicaRaw,
      materiaisRecentes,
      materiaisPlanoRecentes,
      avaliacoesSemanaPorDisciplina,
      aulasSemanaPorDisciplina,
      turmaDisciplinas,
    ] = await Promise.all([
      prisma.trocaProfessorProposta.count({
        where: {
          schoolId,
          professorAlvoId: professorId,
          status: "PENDENTE",
        },
      }).catch(() => 0),
      prisma.aulaRegistro.findMany({
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          dataAula: { gte: todayStart, lte: todayEnd },
        },
        select: { id: true, turmaId: true },
      }),
      prisma.avaliacao.findMany({
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          deletedAt: null,
          dataAvaliacao: { lte: todayEnd },
        },
        select: {
          id: true,
          turmaId: true,
          notas: { select: { matriculaId: true } },
        },
      }),
      prisma.matricula.findMany({
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          status: "ATIVA",
        },
        select: {
          id: true,
          turmaId: true,
          aluno: { select: { nome: true } },
          turma: { select: { nome: true } },
        },
      }),
      prisma.avaliacao.findMany({
        where: { schoolId, turmaId: { in: turmaIds }, deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          titulo: true,
          createdAt: true,
          turma: { select: { nome: true } },
        },
      }),
      prisma.aulaRegistro.findMany({
        where: { schoolId, turmaId: { in: turmaIds } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: {
          id: true,
          createdAt: true,
          titulo: true,
          turma: { select: { nome: true } },
        },
      }),
      prisma.notaAvaliacao.findMany({
        where: {
          schoolId,
          avaliacao: { turmaId: { in: turmaIds }, deletedAt: null },
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: {
          id: true,
          updatedAt: true,
          matricula: {
            select: {
              aluno: { select: { nome: true } },
              turma: { select: { nome: true } },
            },
          },
        },
      }),
      prisma.presencaAula.findMany({
        where: {
          schoolId,
          aula: { turmaId: { in: turmaIds } },
          createdAt: {
            gte: new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          matriculaId: true,
          presente: true,
        },
      }),
      prisma.notaAvaliacao.findMany({
        where: {
          schoolId,
          avaliacao: { turmaId: { in: turmaIds }, deletedAt: null },
          updatedAt: {
            gte: new Date(todayStart.getTime() - 60 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          matriculaId: true,
          nota: true,
        },
      }),
      prisma.aulaRegistro.count({
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          dataAula: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.avaliacao.count({
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          deletedAt: null,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.notaAvaliacao.count({
        where: {
          schoolId,
          avaliacao: { turmaId: { in: turmaIds }, deletedAt: null },
          updatedAt: { gte: weekStart, lte: weekEnd },
        },
      }),
      prisma.presencaAula.findMany({
        where: {
          schoolId,
          aula: { turmaId: { in: turmaIds } },
          createdAt: { gte: twentyEightDaysAgo },
        },
        select: {
          presente: true,
          createdAt: true,
          aula: { select: { turmaId: true } },
        },
      }),
      prisma.notaAvaliacao.findMany({
        where: {
          schoolId,
          avaliacao: { turmaId: { in: turmaIds }, deletedAt: null },
          updatedAt: { gte: sixtyDaysAgo },
        },
        select: {
          nota: true,
          updatedAt: true,
          avaliacao: { select: { turmaId: true } },
        },
      }),
      prisma.notificacao.findMany({
        where: notificationWhere,
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          titulo: true,
          mensagem: true,
          tipo: true,
          createdAt: true,
          lida: true,
        },
      }),
      prisma.materialDidatico.findMany({
        where: {
          schoolId,
          professorId,
          turmaId: { in: turmaIds },
          createdAt: { gte: fourteenDaysAgo },
        },
        select: { id: true, turmaId: true, titulo: true, createdAt: true, tipo: true },
      }),
      prisma.materialDidatico.findMany({
        where: {
          schoolId,
          professorId,
          turmaId: { in: turmaIds },
          tipo: "PLANO_AULA",
        },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, turmaId: true, titulo: true, createdAt: true },
      }),
      prisma.avaliacao.groupBy({
        by: ["disciplinaId"],
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          deletedAt: null,
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _count: { _all: true },
      }),
      prisma.aulaRegistro.groupBy({
        by: ["disciplinaId"],
        where: {
          schoolId,
          turmaId: { in: turmaIds },
          dataAula: { gte: weekStart, lte: weekEnd },
        },
        _count: { _all: true },
      }),
      prisma.turmaDisciplina.findMany({
        where: { schoolId, turmaId: { in: turmaIds } },
        select: { disciplinaId: true, disciplina: { select: { nome: true } } },
      }),
    ]);

    const turmasComAulaHoje = new Set(
      turmas
        .filter((t) => t.horarios.some((h) => h.diaSemana === diaHoje))
        .map((t) => t.id)
    );
    const turmasComAulaRegistradaHoje = new Set(aulasHoje.map((a) => a.turmaId));
    const chamadasParaFechar = Array.from(turmasComAulaHoje).filter(
      (id) => !turmasComAulaRegistradaHoje.has(id)
    ).length;

    const ativasPorTurma = new Map<string, string[]>();
    for (const m of matriculasAtivas) {
      const curr = ativasPorTurma.get(m.turmaId) ?? [];
      curr.push(m.id);
      ativasPorTurma.set(m.turmaId, curr);
    }

    let avaliacoesSemNota = 0;
    for (const a of avaliacoesComNotas) {
      const esperadas = new Set(ativasPorTurma.get(a.turmaId) ?? []);
      if (!esperadas.size) continue;
      const lancadas = new Set(a.notas.map((n) => n.matriculaId));
      if (lancadas.size < esperadas.size) avaliacoesSemNota += 1;
    }

    let proximaAula: {
      turmaId: string;
      turmaNome: string;
      cursoNome: string;
      diaLabel: string;
      horaInicio: string;
      horaFim: string;
      startsInMinutes: number;
    } | null = null;

    const nowDay = now.getDay();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    for (const turma of turmas) {
      for (const horario of turma.horarios) {
        const targetDayMap: Record<string, number> = {
          DOMINGO: 0,
          SEGUNDA: 1,
          TERCA: 2,
          QUARTA: 3,
          QUINTA: 4,
          SEXTA: 5,
          SABADO: 6,
        };
        const targetDay = targetDayMap[horario.diaSemana] ?? 0;
        let deltaDays = targetDay - nowDay;
        const startMin = parseHourToMinutes(horario.horaInicio);
        if (deltaDays < 0 || (deltaDays === 0 && startMin <= nowMinutes)) {
          deltaDays += 7;
        }
        const startsInMinutes = deltaDays * 24 * 60 + (startMin - nowMinutes);
        if (!proximaAula || startsInMinutes < proximaAula.startsInMinutes) {
          proximaAula = {
            turmaId: turma.id,
            turmaNome: turma.nome,
            cursoNome: turma.curso.nome,
            diaLabel: labelDiaSemana(horario.diaSemana),
            horaInicio: horario.horaInicio,
            horaFim: horario.horaFim,
            startsInMinutes,
          };
        }
      }
    }

    const lancamentosRecentes = [
      ...avaliacoesRecentes.map((a) => ({
        id: `avaliacao:${a.id}`,
        tipo: "AVALIACAO" as const,
        titulo: `Avaliação criada: ${a.titulo}`,
        turmaNome: a.turma.nome,
        createdAt: a.createdAt.toISOString(),
      })),
      ...aulasRecentes.map((a) => ({
        id: `aula:${a.id}`,
        tipo: "CHAMADA" as const,
        titulo: a.titulo ? `Chamada: ${a.titulo}` : "Chamada registrada",
        turmaNome: a.turma.nome,
        createdAt: a.createdAt.toISOString(),
      })),
      ...notasRecentes.map((n) => ({
        id: `nota:${n.id}`,
        tipo: "NOTA" as const,
        titulo: `Nota lançada: ${n.matricula.aluno.nome}`,
        turmaNome: n.matricula.turma.nome,
        createdAt: n.updatedAt.toISOString(),
      })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 8);

    const attendanceMap = new Map<string, { total: number; faltas: number }>();
    for (const p of presencas30d) {
      const curr = attendanceMap.get(p.matriculaId) ?? { total: 0, faltas: 0 };
      curr.total += 1;
      if (!p.presente) curr.faltas += 1;
      attendanceMap.set(p.matriculaId, curr);
    }

    const gradesMap = new Map<string, { total: number; soma: number }>();
    for (const n of notas60d) {
      const curr = gradesMap.get(n.matriculaId) ?? { total: 0, soma: 0 };
      curr.total += 1;
      curr.soma += Number(n.nota);
      gradesMap.set(n.matriculaId, curr);
    }

    const alertasPedagogicos: {
      id: string;
      tipo: "FREQUENCIA_BAIXA" | "RENDIMENTO_BAIXO";
      alunoNome: string;
      turmaNome: string;
      detalhe: string;
      explicacao: string;
    }[] = [];

    for (const m of matriculasAtivas) {
      const freq = attendanceMap.get(m.id);
      if (freq && freq.total >= profileOverride.minAttendanceSamples) {
        const taxa = ((freq.total - freq.faltas) / freq.total) * 100;
        if (taxa < profileOverride.minAttendancePercent) {
          alertasPedagogicos.push({
            id: `freq:${m.id}`,
            tipo: "FREQUENCIA_BAIXA",
            alunoNome: m.aluno.nome,
            turmaNome: m.turma.nome,
            detalhe: `Frequência ${taxa.toFixed(0)}% nos últimos 30 dias`,
            explicacao:
              "Faltas recorrentes em chamadas recentes; vale contato com responsável e plano de recuperação.",
          });
        }
      }
      const grd = gradesMap.get(m.id);
      if (grd && grd.total >= profileOverride.minGradeSamples) {
        const media = grd.soma / grd.total;
        if (media < profileOverride.minGrade) {
          alertasPedagogicos.push({
            id: `nota:${m.id}`,
            tipo: "RENDIMENTO_BAIXO",
            alunoNome: m.aluno.nome,
            turmaNome: m.turma.nome,
            detalhe: `Média ${media.toFixed(1)} nas últimas avaliações`,
            explicacao:
              "Desempenho abaixo do limiar configurado; sugerido reforço direcionado e atividade diagnóstica.",
          });
        }
      }
    }

    const resumoTurmas = turmas.map((turma) => {
      const presencasTurma = presencas28dPorTurma.filter((p) => p.aula.turmaId === turma.id);
      const currPresence = presencasTurma.filter((p) => p.createdAt >= fourteenDaysAgo);
      const prevPresence = presencasTurma.filter((p) => p.createdAt < fourteenDaysAgo);
      const currFreq = pct(currPresence.filter((p) => p.presente).length, currPresence.length);
      const prevFreq = pct(prevPresence.filter((p) => p.presente).length, prevPresence.length);
      const trendFreq = currFreq - prevFreq;

      const notasTurma = notas60dPorTurma.filter((n) => n.avaliacao.turmaId === turma.id);
      const currNotas = notasTurma.filter((n) => n.updatedAt >= thirtyDaysAgo(todayStart));
      const prevNotas = notasTurma.filter((n) => n.updatedAt < thirtyDaysAgo(todayStart));
      const currMedia =
        currNotas.length > 0
          ? currNotas.reduce((sum, n) => sum + Number(n.nota), 0) / currNotas.length
          : 0;
      const prevMedia =
        prevNotas.length > 0
          ? prevNotas.reduce((sum, n) => sum + Number(n.nota), 0) / prevNotas.length
          : 0;
      return {
        turmaId: turma.id,
        turmaNome: turma.nome,
        cursoNome: turma.curso.nome,
        frequenciaAtual: Number(currFreq.toFixed(1)),
        frequenciaTendencia: Number(trendFreq.toFixed(1)),
        mediaAtual: Number(currMedia.toFixed(1)),
        mediaTendencia: Number((currMedia - prevMedia).toFixed(1)),
      };
    });

    const inboxPedagogica = inboxPedagogicaRaw.map((n) => ({
      id: n.id,
      titulo: n.titulo,
      tipo: n.tipo,
      lida: n.lida,
      createdAt: n.createdAt.toISOString(),
      mensagemPreview: n.mensagem.slice(0, 180),
    }));

    const metasPorDisciplinaMap = new Map(
      turmaDisciplinas.map((td) => [td.disciplinaId, td.disciplina.nome] as const)
    );
    const aulasByDisciplina = new Map(
      aulasSemanaPorDisciplina.map((row) => [row.disciplinaId, row._count._all] as const)
    );
    const avalByDisciplina = new Map(
      avaliacoesSemanaPorDisciplina.map((row) => [row.disciplinaId, row._count._all] as const)
    );
    const metasPorDisciplina = Array.from(metasPorDisciplinaMap.entries()).map(
      ([disciplinaId, nome]) => ({
        disciplinaId,
        disciplinaNome: nome,
        aulas: {
          concluidas: aulasByDisciplina.get(disciplinaId) ?? 0,
          meta: 1,
        },
        avaliacoes: {
          concluidas: avalByDisciplina.get(disciplinaId) ?? 0,
          meta: 1,
        },
      })
    );

    const filaAcoes = [
      ...(chamadasParaFechar > 0
        ? [
            {
              id: "acao-chamadas",
              titulo: `Fechar ${chamadasParaFechar} chamada(s) de hoje`,
              href: "/docente#turmas-docente",
              tipo: "CHAMADA" as const,
            },
          ]
        : []),
      ...(avaliacoesSemNota > 0
        ? [
            {
              id: "acao-notas",
              titulo: `Lançar notas em ${avaliacoesSemNota} avaliação(ões)`,
              href: "/docente/avaliacoes/nova",
              tipo: "NOTA" as const,
            },
          ]
        : []),
      ...(trocasPendentes > 0
        ? [
            {
              id: "acao-trocas",
              titulo: `Responder ${trocasPendentes} convite(s) de troca`,
              href: "/docente/trocas",
              tipo: "TROCA" as const,
            },
          ]
        : []),
      ...(alertasPedagogicos.length > 0
        ? [
            {
              id: "acao-alertas",
              titulo: `Revisar ${alertasPedagogicos.length} alerta(s) pedagógico(s)`,
              href: "/docente",
              tipo: "ALERTA" as const,
            },
          ]
        : []),
    ].slice(0, 6);

    const agendaDidatica =
      proximaAula ?
        {
          ...proximaAula,
          materiaisRecentes: materiaisRecentes.filter(
            (m) => m.turmaId === proximaAula.turmaId
          ).length,
          planoAulaMaisRecente:
            materiaisPlanoRecentes.find((m) => m.turmaId === proximaAula.turmaId)
              ?.titulo ?? null,
        }
      : null;

    const relatorioSemanal = {
      resumo: `Você registrou ${aulasSemana} chamada(s), criou ${avaliacoesSemana} avaliação(ões) e lançou ${notasSemana} nota(s) nesta semana.`,
      prioridades: filaAcoes.map((a) => a.titulo).slice(0, 3),
    };

    return NextResponse.json({
      pendenciasDia: {
        chamadasParaFechar,
        avaliacoesSemNota,
        trocasPendentes,
      },
      proximaAula,
      agendaDidatica,
      filaAcoes,
      lancamentosRecentes,
      inboxPedagogica,
      resumoTurmas,
      metasPorDisciplina,
      alertasPedagogicos: alertasPedagogicos.slice(0, 6),
      relatorioSemanal,
      checklistSemanal: {
        chamadas: {
          concluidas: aulasSemana,
          total: profileOverride.weeklyCallsTarget,
        },
        avaliacoes: {
          concluidas: avaliacoesSemana,
          total: profileOverride.weeklyAssessmentsTarget,
        },
        notas: { concluidas: notasSemana, total: profileOverride.weeklyGradesTarget },
      },
      configAplicada: profileOverride,
    });
  } catch (error) {
    console.error("Erro em GET /api/docente/dashboard-insights:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os insights do dashboard." },
      { status: 500 }
    );
  }
}
