"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const SHORTCUTS = [
  {
    group: "Navegação",
    items: [
      { keys: ["G", "D"], label: "Ir para Dashboard" },
      { keys: ["G", "A"], label: "Ir para Alunos" },
      { keys: ["G", "F"], label: "Ir para Financeiro" },
      { keys: ["G", "C"], label: "Ir para Calendário" },
      { keys: ["G", "R"], label: "Ir para Relatórios" },
    ],
  },
  {
    group: "Busca",
    items: [
      { keys: ["⌘", "K"], label: "Abrir busca global" },
      { keys: ["?"], label: "Ver atalhos de teclado" },
      { keys: ["ESC"], label: "Fechar modal / busca" },
    ],
  },
  {
    group: "Listas",
    items: [
      { keys: ["↑", "↓"], label: "Navegar nos resultados" },
      { keys: ["↵"], label: "Selecionar item" },
    ],
  },
];

export function KeyboardShortcutsModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable;
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
          <DialogTitle>Atalhos de teclado</DialogTitle>
          <DialogDescription>
            Use esses atalhos para navegar mais rápido pelo sistema.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {group.group}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-muted/50">
                    <span className="text-sm text-foreground">{item.label}</span>
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
          Pressione <kbd className="rounded border border-border px-1 text-[10px]">?</kbd> para abrir este modal
        </p>
      </DialogContent>
    </Dialog>
  );
}
