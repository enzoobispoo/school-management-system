import type {
  IncidentCategory,
  IncidentSeverity,
} from "@prisma/client";

export type IncidentDetectionResult = {
  dedupeKey: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  title: string;
  description: string;
  problemStatement: string;
  suggestedActions: string[];
  impactHint?: string;
  contextJson?: Record<string, unknown>;
};

export type PlaybookDefinitionV1 = {
  version: 1;
  detect: {
    handler: string;
  };
  actions: PlaybookActionV1[];
};

export type PlaybookActionV1 =
  | {
      type: "notificacao_sistema";
      titulo: string;
      mensagem: string;
      /** Hours between repeated notifications for same incident */
      notifyEveryHours?: number;
    }
  | {
      type: "finance_audit";
      eventType: string;
      message: string;
    };
