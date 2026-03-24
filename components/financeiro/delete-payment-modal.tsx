"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface DeletePaymentModalProps {
  open: boolean
  onClose: () => void
  payment: {
    id: string
    student: string
    description: string
    amount: number
  } | null
  onConfirm: (paymentId: string) => Promise<void>
  loading?: boolean
}

export function DeletePaymentModal({
  open,
  onClose,
  payment,
  onConfirm,
  loading = false,
}: DeletePaymentModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir mensalidade</AlertDialogTitle>
          <AlertDialogDescription>
            {payment ? (
              <>
                Você tem certeza que deseja excluir a cobrança{" "}
                <strong>{payment.description}</strong> de{" "}
                <strong>{payment.student}</strong> no valor de{" "}
                <strong>R$ {payment.amount.toFixed(2).replace(".", ",")}</strong>?
                Essa ação não poderá ser desfeita.
              </>
            ) : (
              "Tem certeza que deseja excluir esta mensalidade?"
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!payment || loading}
            onClick={async (e) => {
              e.preventDefault()
              if (!payment) return
              await onConfirm(payment.id)
            }}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "Excluindo..." : "Excluir mensalidade"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}