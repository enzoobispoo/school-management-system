"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { TeachersPageContent } from "@/components/professores/teachers-page-content";
import { TeachersModals } from "@/components/professores/teachers-modals";
import { useTeachersPage } from "@/hooks/professores/use-teachers-page";

export default function ProfessoresPage() {
  const teachersPage = useTeachersPage();

  return (
    <DashboardLayout>
      <Header title="Professores" description="Gerencie o corpo docente" />

      <TeachersPageContent
        teachers={teachersPage.teachers}
        search={teachersPage.search}
        setSearch={teachersPage.setSearch}
        courseFilter={teachersPage.courseFilter}
        setCourseFilter={teachersPage.setCourseFilter}
        loading={teachersPage.loading}
        error={teachersPage.error}
        submitting={teachersPage.submitting}
        onCreateTeacher={teachersPage.handleCreateTeacher}
        onEdit={teachersPage.openEditTeacher}
        onDelete={teachersPage.openToggleTeacher}
      />

      <TeachersModals
        editOpen={teachersPage.editOpen}
        onEditOpenChange={teachersPage.closeEditModal}
        toggleOpen={teachersPage.toggleOpen}
        onToggleOpenChange={teachersPage.setToggleOpen}
        editingTeacher={teachersPage.editingTeacher}
        teacherToToggle={teachersPage.teacherToToggle}
        submitting={teachersPage.submitting}
        onSubmitEdit={teachersPage.submitEditTeacher}
        onConfirmToggleStatus={teachersPage.confirmToggleTeacherStatus}
      />
    </DashboardLayout>
  );
}