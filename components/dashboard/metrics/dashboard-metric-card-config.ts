import {
  Users,
  GraduationCap,
  Wallet,
  AlertCircle,
  RefreshCcw,
  UserPlus,
  School,
  BadgeAlert,
  Bell,
  Briefcase,
} from "lucide-react";

export type FixedMetricKey =
  | "totalAlunos"
  | "matriculasAtivas"
  | "receitaMensal"
  | "pagamentosAtrasados";

export type OptionalMetricKey =
  | "trocasProfessorNoMes"
  | "novosAlunosNoMes"
  | "turmasAtivas"
  | "turmasLotadas"
  | "turmasComVagasOciosas"
  | "professoresInativos"
  | "notificacoesNaoLidas"
  | "receitaPrevistaMes";

export type DashboardMetricKey = FixedMetricKey | OptionalMetricKey;

export interface DashboardMetricsView {
  totalAlunos: string;
  matriculasAtivas: string;
  receitaMensal: string;
  receitaMensalVariacao: number;
  pagamentosAtrasados: string;
  quantidadePagamentosAtrasados: number;
  quantidadePagamentosPendentes: number;
  trocasProfessorNoMes: string;
  trocasProfessorVariacao: number;
  novosAlunosNoMes: string;
  novosAlunosVariacao: number;
  turmasAtivas: string;
  turmasLotadas: string;
  turmasComVagasOciosas: string;
  professoresInativos: string;
  notificacoesNaoLidas: string;
  receitaPrevistaMes: string;
}

export interface MetricCardConfigItem {
  title: string;
  change?: string;
  changeType: "neutral" | "positive" | "negative";
  icon: any;
  href?: string;
}

export const FIXED_METRIC_CARDS: FixedMetricKey[] = [
  "totalAlunos",
  "matriculasAtivas",
  "receitaMensal",
  "pagamentosAtrasados",
];

export const OPTIONAL_METRIC_CARDS: Array<{
  key: OptionalMetricKey;
  label: string;
}> = [
  { key: "trocasProfessorNoMes", label: "Trocas de professor" },
  { key: "novosAlunosNoMes", label: "Novos alunos no mês" },
  { key: "turmasAtivas", label: "Turmas ativas" },
  { key: "turmasLotadas", label: "Turmas lotadas" },
  { key: "turmasComVagasOciosas", label: "Turmas com vagas ociosas" },
  { key: "professoresInativos", label: "Professores inativos" },
  { key: "notificacoesNaoLidas", label: "Notificações não lidas" },
  { key: "receitaPrevistaMes", label: "Receita prevista do mês" },
];

export const DEFAULT_OPTIONAL_METRIC_CARDS: Record<OptionalMetricKey, boolean> =
  {
    trocasProfessorNoMes: true,
    novosAlunosNoMes: true,
    turmasAtivas: true,
    turmasLotadas: true,
    turmasComVagasOciosas: true,
    professoresInativos: true,
    notificacoesNaoLidas: true,
    receitaPrevistaMes: true,
  };

export const DEFAULT_DASHBOARD_CARDS_ORDER: DashboardMetricKey[] = [
  "totalAlunos",
  "matriculasAtivas",
  "receitaMensal",
  "pagamentosAtrasados",
  "trocasProfessorNoMes",
  "novosAlunosNoMes",
  "turmasAtivas",
  "turmasLotadas",
  "turmasComVagasOciosas",
  "professoresInativos",
  "notificacoesNaoLidas",
  "receitaPrevistaMes",
];

export const METRIC_CARD_ICON_COLOR =
  "bg-black/[0.04] text-black dark:bg-muted dark:text-foreground";

  export const METRIC_CARD_CONFIG: Record<
  DashboardMetricKey,
  MetricCardConfigItem
> = {
  totalAlunos: {
    title: "Total de Alunos",
    change: "Alunos cadastrados",
    changeType: "neutral",
    icon: Users,
    href: "/alunos",
  },
  matriculasAtivas: {
    title: "Matrículas Ativas",
    change: "Matrículas em andamento",
    changeType: "neutral",
    icon: GraduationCap,
    href: "/alunos?matriculaStatus=ATIVA",
  },
  receitaMensal: {
    title: "Receita Mensal",
    change: "Recebido no mês",
    changeType: "positive",
    icon: Wallet,
    href: "/financeiro",
  },
  pagamentosAtrasados: {
    title: "Pagamentos Atrasados",
    changeType: "negative",
    icon: AlertCircle,
    href: "/financeiro?tab=overdue",
  },
  trocasProfessorNoMes: {
    title: "Trocas de Professor",
    change: "Neste mês",
    changeType: "neutral",
    icon: RefreshCcw,
    href: "/turmas",
  },
  novosAlunosNoMes: {
    title: "Novos Alunos",
    change: "Entraram neste mês",
    changeType: "positive",
    icon: UserPlus,
    href: "/alunos?recent=true",
  },
  turmasAtivas: {
    title: "Turmas Ativas",
    change: "Turmas em funcionamento",
    changeType: "neutral",
    icon: School,
    href: "/turmas?ativo=true",
  },
  turmasLotadas: {
    title: "Turmas Lotadas",
    change: "Sem vagas disponíveis",
    changeType: "negative",
    icon: BadgeAlert,
    href: "/turmas?ocupacao=lotadas",
  },
  turmasComVagasOciosas: {
    title: "Vagas Ociosas",
    change: "Turmas com vagas livres",
    changeType: "neutral",
    icon: School,
    href: "/turmas?ocupacao=ociosas",
  },
  professoresInativos: {
    title: "Professores Inativos",
    change: "Fora de operação",
    changeType: "neutral",
    icon: Briefcase,
    href: "/professores?ativo=false",
  },
  notificacoesNaoLidas: {
    title: "Não Lidas",
    change: "Notificações pendentes",
    changeType: "neutral",
    icon: Bell,
    href: "/notificacoes",
  },
  receitaPrevistaMes: {
    title: "Receita Prevista",
    change: "Prevista para o mês",
    changeType: "neutral",
    icon: Wallet,
    href: "/financeiro",
  },
};