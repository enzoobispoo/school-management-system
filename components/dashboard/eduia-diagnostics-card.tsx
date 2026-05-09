"use client";

import { useCallback, useState } from "react";
import { Activity, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildClientDiagnosticsMarkdown } from "@/lib/eduia/build-client-diagnostics";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface EduiaDiagnosticsCardProps {
  /** Injeta o texto no campo da EduIA ao lado (callback do painel). */
  onAppendToAssistant?: (text: string) => void;
}

export function EduiaDiagnosticsCard({
  onAppendToAssistant,
}: EduiaDiagnosticsCardProps) {
  const { t } = useDashboardLanguage();
  const [copied, setCopied] = useState(false);

  const build = useCallback(() => buildClientDiagnosticsMarkdown(), []);

  const handleCopy = useCallback(async () => {
    const text = build();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }, [build]);

  const handleSendToAssistant = useCallback(() => {
    const text = `${build()}${t("eduia.diagnostics.promptSuffix")}`;
    onAppendToAssistant?.(text);
  }, [build, onAppendToAssistant, t]);

  return (
    <div className="rounded-2xl border border-border/70 bg-muted/15 p-4 dark:bg-muted/10">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Activity className="h-4 w-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-foreground">
            {t("eduia.diagnostics.title")}
          </p>
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {t("eduia.diagnostics.body")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="rounded-xl"
              onClick={() => void handleCopy()}
            >
              <ClipboardCopy className="mr-2 h-3.5 w-3.5" />
              {copied ? t("eduia.diagnostics.copied") : t("eduia.diagnostics.copy")}
            </Button>
            {onAppendToAssistant ?
              <Button
                type="button"
                size="sm"
                className="rounded-xl"
                onClick={handleSendToAssistant}
              >
                {t("eduia.diagnostics.send")}
              </Button>
            : null}
          </div>
        </div>
      </div>
    </div>
  );
}
