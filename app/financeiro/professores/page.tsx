"use client";

import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroProfessoresClient } from "@/components/financeiro/financeiro-professores-client";

export default function FinanceiroProfessoresPage() {
  return (
    <>
      <Header
        title="Professores · Financeiro"
        description="Regime CLT/PJ, dados para pagamento e lançamento de repasses internos."
      />
      <FinanceiroHubNav />
      <FinanceiroProfessoresClient />
    </>
  );
}
