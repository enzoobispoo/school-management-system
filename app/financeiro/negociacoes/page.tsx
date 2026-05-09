"use client";

import { Header } from "@/components/dashboard/header";
import { FinanceiroHubNav } from "@/components/financeiro/financeiro-hub-nav";
import { FinanceiroNegociacoesClient } from "@/components/financeiro/financeiro-negociacoes-client";

export default function FinanceiroNegociacoesPage() {
  return (
    <>
      <Header
        title="Negociações de mensalidades"
        description="Histórico de propostas e acordos registrados pela equipe financeira."
      />
      <FinanceiroHubNav />
      <FinanceiroNegociacoesClient />
    </>
  );
}
