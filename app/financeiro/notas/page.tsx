"use client";

import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroNotasClient } from "@/components/financeiro/financeiro-notas-client";

export default function FinanceiroNotasPage() {
  return (
    <>
      <Header
        title="Documentos fiscais internos"
        description="Prefatura com itens e descontos; PDF para arquivo. Integração NFS-e/NF-e via provedor pode usar os campos externos."
      />
      <FinanceiroHubNav />
      <FinanceiroNotasClient />
    </>
  );
}
