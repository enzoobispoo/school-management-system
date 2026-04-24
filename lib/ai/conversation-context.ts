type ConversationContext =
  | {
      scope: "top_courses";
      items: Array<{
        id: string;
        name: string;
        category: string;
        students: number;
      }>;
    }
  | {
      scope: "overdue_payments";
      items: Array<{
        id: string;
        studentName: string;
        courseName: string;
        amount: number;
        dueDate: string;
      }>;
    }
  | null;

export function normalizeConversationContext(
  input: unknown
): ConversationContext {
  if (!input || typeof input !== "object") return null;

  const raw = input as {
    scope?: unknown;
    items?: unknown;
  };

  if (raw.scope === "top_courses" && Array.isArray(raw.items)) {
    const items = raw.items
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const value = item as {
          id?: unknown;
          name?: unknown;
          category?: unknown;
          students?: unknown;
        };

        if (
          typeof value.id !== "string" ||
          typeof value.name !== "string" ||
          typeof value.category !== "string" ||
          typeof value.students !== "number"
        ) {
          return null;
        }

        return {
          id: value.id,
          name: value.name,
          category: value.category,
          students: value.students,
        };
      })
      .filter(
        (
          item
        ): item is {
          id: string;
          name: string;
          category: string;
          students: number;
        } => item !== null
      );

    return {
      scope: "top_courses",
      items,
    };
  }

  if (raw.scope === "overdue_payments" && Array.isArray(raw.items)) {
    const items = raw.items
      .map((item) => {
        if (!item || typeof item !== "object") return null;

        const value = item as {
          id?: unknown;
          studentName?: unknown;
          courseName?: unknown;
          amount?: unknown;
          dueDate?: unknown;
        };

        if (
          typeof value.id !== "string" ||
          typeof value.studentName !== "string" ||
          typeof value.courseName !== "string" ||
          typeof value.amount !== "number" ||
          typeof value.dueDate !== "string"
        ) {
          return null;
        }

        return {
          id: value.id,
          studentName: value.studentName,
          courseName: value.courseName,
          amount: value.amount,
          dueDate: value.dueDate,
        };
      })
      .filter(
        (
          item
        ): item is {
          id: string;
          studentName: string;
          courseName: string;
          amount: number;
          dueDate: string;
        } => item !== null
      );

    return {
      scope: "overdue_payments",
      items,
    };
  }

  return null;
}

export function extractFollowUpFilters(message: string) {
    const lower = message.toLowerCase().trim();
  
    const firstNMatch = lower.match(/\b(\d+)\b/);
    const limit = firstNMatch ? Number(firstNMatch[1]) : null;
  
    let courseName: string | null = null;
  
    const coursePatterns = [
      /curso de ([\p{L}\s]+)/iu,
      /do curso ([\p{L}\s]+)/iu,
      /da turma de ([\p{L}\s]+)/iu,
      /s[oó] os de ([\p{L}\s]+)/iu,
      /somente os de ([\p{L}\s]+)/iu,
      /apenas os de ([\p{L}\s]+)/iu,
      /de ([\p{L}\s]+)/iu,
    ];
  
    for (const pattern of coursePatterns) {
      const match = lower.match(pattern);
      if (match?.[1]) {
        courseName = match[1].trim();
        break;
      }
    }
  
    return {
      courseName,
      limit,
      asksSubset:
        lower.includes("agora") ||
        lower.includes("só") ||
        lower.includes("somente") ||
        lower.includes("primeiros") ||
        lower.includes("primeiras") ||
        lower.includes("mostre") ||
        lower.includes("apenas"),
    };
  }

export function isContextualFollowUp(message: string) {
  const lower = message.toLowerCase();

  return (
    lower.includes("agora") ||
    lower.includes("só") ||
    lower.includes("somente") ||
    lower.includes("primeiros") ||
    lower.includes("primeiras") ||
    lower.includes("do curso") ||
    lower.includes("curso de") ||
    lower.includes("me mostre")
  );
}