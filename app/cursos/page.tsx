"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { CoursesPageContent } from "@/components/cursos/courses-page-content";
import { CoursesModals } from "@/components/cursos/courses-modals";
import { useCoursesPage } from "@/hooks/cursos/use-courses-page";

export default function CursosPage() {
  const coursesPage = useCoursesPage();

  return (
    <DashboardLayout>
      <Header
        title="Cursos"
        description="Gerencie todos os cursos disponíveis"
      />

      <CoursesPageContent
        courses={coursesPage.courses}
        search={coursesPage.search}
        setSearch={coursesPage.setSearch}
        category={coursesPage.category}
        setCategory={coursesPage.setCategory}
        loading={coursesPage.loading}
        error={coursesPage.error}
        submitting={coursesPage.submitting}
        onCreateCourse={coursesPage.handleCreateCourse}
        onRefresh={coursesPage.fetchCourses}
        onEdit={coursesPage.openEditCourse}
        onDelete={coursesPage.openDeleteCourse}
      />

      <CoursesModals
        editOpen={coursesPage.editOpen}
        onEditOpenChange={coursesPage.closeEditModal}
        deleteOpen={coursesPage.deleteOpen}
        onDeleteOpenChange={coursesPage.setDeleteOpen}
        editingCourse={coursesPage.editingCourse}
        courseToDelete={coursesPage.courseToDelete}
        submitting={coursesPage.submitting}
        onSubmitEdit={coursesPage.submitEditCourse}
        onConfirmToggleStatus={coursesPage.confirmToggleCourseStatus}
      />
    </DashboardLayout>
  );
}