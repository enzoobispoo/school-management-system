"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export function KeyboardShortcutsModal() {
  const { t } = useDashboardLanguage();
  const [open, setOpen] = useState(false);

  const shortcuts = useMemo(
    () => [
      {
        groupKey: "shortcuts.group.navigation",
        items: [
          { keys: ["G", "D"], labelKey: "shortcuts.nav.dashboard" },
          { keys: ["G", "A"], labelKey: "shortcuts.nav.students" },
          { keys: ["G", "F"], labelKey: "shortcuts.nav.finance" },
          { keys: ["G", "C"], labelKey: "shortcuts.nav.calendar" },
          { keys: ["G", "R"], labelKey: "shortcuts.nav.reports" },
        ],
      },
      {
        groupKey: "shortcuts.group.search",
        items: [
          { keys: ["⌘", "K"], labelKey: "shortcuts.search.open" },
          { keys: ["?"], labelKey: "shortcuts.search.help" },
          { keys: ["ESC"], labelKey: "shortcuts.search.close" },
        ],
      },
      {
        groupKey: "shortcuts.group.lists",
        items: [
          { keys: ["↑", "↓"], labelKey: "shortcuts.lists.navigate" },
          { keys: ["↵"], labelKey: "shortcuts.lists.select" },
        ],
      },
    ],
    []
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "?" && !isInput && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] rounded-[28px]">
        <DialogHeader>
          <DialogTitle>{t("shortcuts.title")}</DialogTitle>
          <DialogDescription>{t("shortcuts.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {shortcuts.map((group) => (
            <div key={group.groupKey}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {t(group.groupKey)}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div
                    key={item.labelKey}
                    className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-muted/50"
                  >
                    <span className="text-sm text-foreground">{t(item.labelKey)}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, i) => (
                        <kbd
                          key={i}
                          className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-border bg-muted px-1.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {t("shortcuts.footer", { key: "?" })}
        </p>
      </DialogContent>
    </Dialog>
  );
}
