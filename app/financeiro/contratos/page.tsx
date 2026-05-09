"use client";

import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroContratosClient } from "@/components/financeiro/financeiro-contratos-client";

export default function FinanceiroContratosPage() {
  return (
    <>
      <Header
        title="Contratos financeiros"
        description="Valores base, descontos, bolsa e reajuste por matrícula ativa."
      />
      <FinanceiroHubNav />
      <FinanceiroContratosClient />
    </>
  );
}
