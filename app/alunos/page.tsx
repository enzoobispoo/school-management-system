"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { StudentsPageContent } from "@/components/alunos/students-page-content";
import { StudentsModals } from "@/components/alunos/students-modals";
import { useStudentsPage } from "@/hooks/alunos/use-students-page";

export default function AlunosPage() {
  const studentsPage = useStudentsPage();

  return (
    <DashboardLayout>
      <Header
        title="Alunos"
        description="Gerencie todos os alunos matriculados"
      />

      <StudentsPageContent
        students={studentsPage.filteredStudents}
        search={studentsPage.search}
        setSearch={studentsPage.setSearch}
        statusFilter={studentsPage.statusFilter}
        setStatusFilter={studentsPage.setStatusFilter}
        loading={studentsPage.loading}
        submitting={studentsPage.submitting}
        error={studentsPage.error}
        page={studentsPage.page}
        setPage={studentsPage.setPage}
        meta={studentsPage.meta}
        advancedFiltersOpen={studentsPage.advancedFiltersOpen}
        setAdvancedFiltersOpen={studentsPage.setAdvancedFiltersOpen}
        advancedFilters={studentsPage.advancedFilters}
        advancedFiltersDraft={studentsPage.advancedFiltersDraft}
        setAdvancedFiltersDraft={studentsPage.setAdvancedFiltersDraft}
        hasAdvancedFilters={studentsPage.hasAdvancedFilters}
        applyAdvancedFilters={studentsPage.applyAdvancedFilters}
        clearAdvancedFilters={studentsPage.clearAdvancedFilters}
        onCreateStudent={studentsPage.handleCreateStudent}
        onEnroll={studentsPage.openEnrollmentStudent}
        onEdit={studentsPage.openEditStudent}
        onDelete={studentsPage.openDeleteStudent}
      />

      <StudentsModals
        editOpen={studentsPage.editOpen}
        setEditOpen={studentsPage.setEditOpen}
        deleteOpen={studentsPage.deleteOpen}
        setDeleteOpen={studentsPage.setDeleteOpen}
        enrollmentOpen={studentsPage.enrollmentOpen}
        setEnrollmentOpen={studentsPage.setEnrollmentOpen}
        submitting={studentsPage.submitting}
        editingStudent={studentsPage.editingStudent}
        setEditingStudent={studentsPage.setEditingStudent}
        studentToDelete={studentsPage.studentToDelete}
        selectedStudent={studentsPage.selectedStudent}
        setSelectedStudent={studentsPage.setSelectedStudent}
        onSubmitEdit={studentsPage.submitEditStudent}
        onConfirmDelete={studentsPage.confirmDeleteStudent}
        onEnrollmentSuccess={studentsPage.fetchStudents}
      />
    </DashboardLayout>
  );
}