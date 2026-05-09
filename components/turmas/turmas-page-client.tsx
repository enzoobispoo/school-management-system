"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { TurmasPageContent } from "@/components/turmas/turmas-page-content";
import { useTurmasPage } from "@/hooks/turmas/use-turmas-page";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export function TurmasPageClient() {
  const { t } = useDashboardLanguage();
  const turmasPage = useTurmasPage();

  return (
    <DashboardLayout>
      <Header
        title={t("page.classes.title")}
        description={
          turmasPage.professorId ?
            t("page.classes.descriptionProfessorFilter")
          : t("page.classes.description")
        }
      />

      <TurmasPageContent
        professorId={turmasPage.professorId}
        ocupacao={turmasPage.ocupacao}
        setOcupacaoFilter={turmasPage.setOcupacaoFilter}
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
        onTeacherChanged={turmasPage.refetchTurmas}
        onRefresh={turmasPage.refetchTurmas}
      />
    </DashboardLayout>
  );
}