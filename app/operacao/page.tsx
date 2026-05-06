import { Suspense } from "react";
import { OperacaoPageClient } from "@/components/operacao/operacao-page-client";

export const metadata = { title: "Central operacional" };

export default function OperacaoPage() {
  return (
    <Suspense fallback={null}>
      <OperacaoPageClient />
    </Suspense>
  );
}
