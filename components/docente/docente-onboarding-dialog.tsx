"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "docente.onboarding.v1.done";

export type DocenteOnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  needsLink: boolean;
};

export function DocenteOnboardingDialog({
  open,
  onOpenChange,
  needsLink,
}: DocenteOnboardingDialogProps) {
  const [step, setStep] = useState(0);

  function finish() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setStep(0);
    onOpenChange(false);
  }

  const steps = [
    {
      title: "Associe sua conta ao cadastro de professor",
      description:
        needsLink ?
          "Sem esse vínculo, turmas e permissões não aparecem direito. Use o fluxo no topo do painel ou peça à secretaria para conferir seu cadastro."
        : "Tudo certo: sua conta já está vinculada ao professor nesta escola.",
    },
    {
      title: "Rotina no menu",
      description:
        "Em Principal ficam o painel, a EduIA, mensagens e avisos. Em Pedagógico você encontra turmas, materiais, avaliações, calendário e trocas de titularidade.",
    },
    {
      title: "EduIA ao lado",
      description:
        "Pergunte sobre suas turmas titulares ou peça rascunhos de avaliações e slides. O sistema só grava depois que você confirma explicitamente.",
    },
  ];

  const current = steps[step] ?? steps[0];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setStep(0);
        onOpenChange(next);
      }}
    >
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Bem-vindo ao painel docente</DialogTitle>
          <DialogDescription>
            Três passos rápidos para se localizar. Você pode fechar e não ver de
            novo quando quiser.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Passo {step + 1} de {steps.length}
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {current.title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {current.description}
          </p>
          {step === 0 && needsLink ?
            <p className="text-sm font-medium">
              <Link
                href="/configuracoes/conta"
                className="text-primary underline-offset-4 hover:underline"
              >
                Abrir configurações da conta
              </Link>
            </p>
          : null}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            className="w-full rounded-xl sm:w-auto"
            onClick={finish}
          >
            Entendi, não mostrar de novo
          </Button>
          <div className="flex w-full justify-end gap-2 sm:w-auto">
            {step > 0 ?
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                Voltar
              </Button>
            : null}
            {step < steps.length - 1 ?
              <Button
                type="button"
                className="rounded-xl"
                onClick={() => setStep((s) => s + 1)}
              >
                Próximo
              </Button>
            : <Button type="button" className="rounded-xl" onClick={finish}>
                Começar
              </Button>}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
