"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { TurmasPageContent } from "@/components/turmas/turmas-page-content";
import { useTurmasPage } from "@/hooks/turmas/use-turmas-page";

export function TurmasPageClient() {
  const turmasPage = useTurmasPage();

  return (
    <DashboardLayout>
      <Header
        title="Turmas"
        description={
          turmasPage.professorId
            ? "Turmas vinculadas ao professor selecionado"
            : "Gerencie as turmas da escola"
        }
      />

      <TurmasPageContent
        professorId={turmasPage.professorId}
        turmas={turmasPage.turmas}
        search={turmasPage.search}
        setSearch={turmasPage.setSearch}
        statusFilter={turmasPage.statusFilter}
        setStatusFilter={turmasPage.setStatusFilter}
        loading={turmasPage.loading}
        error={turmasPage.error}
        page={turmasPage.page}
        setPage={turmasPage.setPage}
        meta={turmasPage.meta}
      />
    </DashboardLayout>
  );
}