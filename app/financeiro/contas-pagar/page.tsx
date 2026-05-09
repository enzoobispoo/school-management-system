"use client";

import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroContasPagarClient } from "@/components/financeiro/financeiro-contas-pagar-client";

export default function FinanceiroContasPagarPage() {
  return (
    <>
      <Header
        title="Contas a pagar"
        description="Fornecedores e obrigações da escola (fluxo de caixa de saída)."
      />
      <FinanceiroHubNav />
      <FinanceiroContasPagarClient />
    </>
  );
}
