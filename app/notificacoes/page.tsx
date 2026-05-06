import { Suspense } from "react";
import { NotificacoesPageClient } from "@/components/notificacoes/notificacoes-page-client";

export const metadata = { title: "Notificações" };

export default function NotificacoesPage() {
  return (
    <Suspense fallback={null}>
      <NotificacoesPageClient />
    </Suspense>
  );
}
