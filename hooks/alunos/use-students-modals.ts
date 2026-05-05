"use client";

import { useState } from "react";
import type { StudentTableItem } from "@/hooks/alunos/use-students-query";

type EditingStudent = {
  id: string;
  nome: string;
  email?: string;
  cpf?: string;
  telefone?: string;
  dataNascimento?: string;
  endereco?: string;
  responsavelNome?: string;
  responsavelTelefone?: string;
  responsavelEmail?: string;
  responsavelCpf?: string;
  // saúde
  possuiLaudo?: boolean;
  laudoTipo?: string;
  laudoCid?: string;
  laudoNivel?: string;
  laudoProfissional?: string;
  laudoData?: string;
  laudoDescricao?: string;
  adaptacaoNecessaria?: boolean;
  adaptacaoDescricao?: string;
  alergias?: string;
  medicamentos?: string;
  condicoesCronicas?: string;
  planoSaude?: string;
  contatoEmergenciaNome?: string;
  contatoEmergenciaTelefone?: string;
  observacoesMedicas?: string;
  observacoesProf?: string;
  tratamentos?: string;
  // extras
  observacoesGerais?: string;
  indicacao?: string;
  nivelInicial?: string;
  idiomaNativo?: string;
  status?: string;
  motivoSaida?: string;
  dataSaida?: string;
};

export function useStudentsModals() {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [enrollmentOpen, setEnrollmentOpen] = useState(false);

  const [studentToDelete, setStudentToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<{
    id: string;
    nome: string;
  } | null>(null);

  const [editingStudent, setEditingStudent] = useState<EditingStudent | null>(
    null
  );

  function openEditStudent(student: StudentTableItem) {
    setEditingStudent({
      id: student.id,
      nome: student.name,
      email: student.email !== "-" ? student.email : undefined,
      telefone: student.phone !== "-" ? student.phone : undefined,
      dataNascimento: student.birthDate
        ? new Date(student.birthDate.split("/").reverse().join("-"))
            .toISOString()
            .slice(0, 10)
        : undefined,
      endereco: student.address ?? undefined,
      cpf: student.cpf ?? undefined,
      responsavelNome: student.guardianName ?? undefined,
      responsavelTelefone:
        student.guardianPhone && student.guardianPhone !== "-"
          ? student.guardianPhone
          : undefined,
      responsavelEmail:
        student.guardianEmail && student.guardianEmail !== "-"
          ? student.guardianEmail
          : undefined,
      responsavelCpf: student.guardianCpf ?? undefined,
      possuiLaudo: student.health?.possuiLaudo,
      laudoTipo: student.health?.laudoTipo,
      laudoCid: student.health?.laudoCid,
      laudoNivel: student.health?.laudoNivel,
      laudoProfissional: student.health?.laudoProfissional,
      laudoData: student.health?.laudoDataRaw,
      laudoDescricao: student.health?.laudoDescricao,
      adaptacaoNecessaria: student.health?.adaptacaoNecessaria,
      adaptacaoDescricao: student.health?.adaptacaoDescricao,
      alergias: student.health?.alergias,
      medicamentos: student.health?.medicamentos,
      condicoesCronicas: student.health?.condicoesCronicas,
      planoSaude: student.health?.planoSaude,
      contatoEmergenciaNome: student.health?.contatoEmergenciaNome,
      contatoEmergenciaTelefone: student.health?.contatoEmergenciaTelefone,
      observacoesMedicas: student.health?.observacoesMedicas,
      observacoesProf: student.health?.observacoesProf,
      tratamentos: student.health?.tratamentos,
      observacoesGerais: student.observacoesGerais,
      indicacao: student.indicacao,
      nivelInicial: student.nivelInicial,
      idiomaNativo: student.idiomaNativo,
      status: student.alunoStatus,
      motivoSaida: student.motivoSaida,
      dataSaida: student.dataSaida,
    });
    setEditOpen(true);
  }

  function openDeleteStudent(student: StudentTableItem) {
    setStudentToDelete({
      id: student.id,
      name: student.name,
    });
    setDeleteOpen(true);
  }

  function openEnrollmentStudent(student: { id: string; nome: string }) {
    setSelectedStudent(student);
    setEnrollmentOpen(true);
  }

  function closeEditModal(open: boolean) {
    setEditOpen(open);
    if (!open) setEditingStudent(null);
  }

  function closeEnrollmentModal() {
    setEnrollmentOpen(false);
    setSelectedStudent(null);
  }

  function closeDeleteModal() {
    setDeleteOpen(false);
    setStudentToDelete(null);
  }

  return {
    editOpen,
    setEditOpen,
    deleteOpen,
    setDeleteOpen,
    enrollmentOpen,
    setEnrollmentOpen,
    studentToDelete,
    selectedStudent,
    setSelectedStudent,
    editingStudent,
    setEditingStudent,
    openEditStudent,
    openDeleteStudent,
    openEnrollmentStudent,
    closeEditModal,
    closeEnrollmentModal,
    closeDeleteModal,
  };
}