"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  onConfirm: () => Promise<void>;
}

export function FinancialGenerateDialog({
  open,
  onOpenChange,
  loading,
  onConfirm,
}: Props) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>
      <Button className="gap-2 rounded-2xl h-11 px-5 bg-black text-white dark:bg-white/10 dark:text-white dark:backdrop-blur-md dark:hover:bg-white/20 border border-black/10 dark:border-white/10 shadow-sm" disabled={loading}>
          <Plus className="h-4 w-4" />
          {loading ? "Gerando..." : "Gerar mensalidades"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Gerar mensalidades</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação vai gerar cobranças para todas as matrículas ativas.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault();
              await onConfirm();
            }}
            disabled={loading}
          >
            {loading ? "Gerando..." : "Confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}