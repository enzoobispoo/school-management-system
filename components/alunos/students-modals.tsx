"use client";

import { StudentModal } from "@/components/alunos/student-modal";
import { EnrollmentModal } from "@/components/alunos/enrollment-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  observacoesGerais?: string;
  indicacao?: string;
  nivelInicial?: string;
  idiomaNativo?: string;
  status?: string;
  motivoSaida?: string;
  dataSaida?: string;
};

interface StudentsModalsProps {
  editOpen: boolean;
  setEditOpen: (open: boolean) => void;
  deleteOpen: boolean;
  setDeleteOpen: (open: boolean) => void;
  enrollmentOpen: boolean;
  setEnrollmentOpen: (open: boolean) => void;
  submitting: boolean;
  editingStudent: EditingStudent | null;
  setEditingStudent: (value: EditingStudent | null) => void;
  studentToDelete: { id: string; name: string } | null;
  selectedStudent: { id: string; nome: string } | null;
  setSelectedStudent: (value: { id: string; nome: string } | null) => void;
  onSubmitEdit: (payload: Record<string, unknown>) => Promise<void>;
  onConfirmDelete: () => Promise<void>;
  onEnrollmentSuccess: () => Promise<void>;
}

export function StudentsModals({
  editOpen,
  setEditOpen,
  deleteOpen,
  setDeleteOpen,
  enrollmentOpen,
  setEnrollmentOpen,
  submitting,
  editingStudent,
  setEditingStudent,
  studentToDelete,
  selectedStudent,
  setSelectedStudent,
  onSubmitEdit,
  onConfirmDelete,
  onEnrollmentSuccess,
}: StudentsModalsProps) {
  return (
    <>
      <StudentModal
        key={editingStudent?.id ?? "edit-student"}
        mode="edit"
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditingStudent(null);
        }}
        hideTrigger
        initialData={
          editingStudent
            ? {
                nome: editingStudent.nome,
                email: editingStudent.email,
                cpf: editingStudent.cpf,
                telefone: editingStudent.telefone,
                dataNascimento: editingStudent.dataNascimento,
                endereco: editingStudent.endereco,
                responsavelNome: editingStudent.responsavelNome,
                responsavelTelefone: editingStudent.responsavelTelefone,
                responsavelEmail: editingStudent.responsavelEmail,
                responsavelCpf: editingStudent.responsavelCpf,
                possuiLaudo: editingStudent.possuiLaudo,
                laudoTipo: editingStudent.laudoTipo,
                laudoCid: editingStudent.laudoCid,
                laudoNivel: editingStudent.laudoNivel,
                laudoProfissional: editingStudent.laudoProfissional,
                laudoData: editingStudent.laudoData,
                laudoDescricao: editingStudent.laudoDescricao,
                adaptacaoNecessaria: editingStudent.adaptacaoNecessaria,
                adaptacaoDescricao: editingStudent.adaptacaoDescricao,
                alergias: editingStudent.alergias,
                medicamentos: editingStudent.medicamentos,
                condicoesCronicas: editingStudent.condicoesCronicas,
                planoSaude: editingStudent.planoSaude,
                contatoEmergenciaNome: editingStudent.contatoEmergenciaNome,
                contatoEmergenciaTelefone: editingStudent.contatoEmergenciaTelefone,
                observacoesMedicas: editingStudent.observacoesMedicas,
                observacoesProf: editingStudent.observacoesProf,
                tratamentos: editingStudent.tratamentos,
                observacoesGerais: editingStudent.observacoesGerais,
                indicacao: editingStudent.indicacao,
                nivelInicial: editingStudent.nivelInicial,
                idiomaNativo: editingStudent.idiomaNativo,
                status: editingStudent.status,
                motivoSaida: editingStudent.motivoSaida,
                dataSaida: editingStudent.dataSaida,
              }
            : null
        }
        title="Editar Aluno"
        description="Atualize os dados do aluno."
        submitLabel="Salvar Alterações"
        loading={submitting}
        onSubmit={onSubmitEdit}
      />

      <EnrollmentModal
        open={enrollmentOpen}
        onClose={() => {
          setEnrollmentOpen(false);
          setSelectedStudent(null);
        }}
        aluno={selectedStudent}
        onSuccess={onEnrollmentSuccess}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir aluno</AlertDialogTitle>
            <AlertDialogDescription>
              {studentToDelete
                ? `Tem certeza que deseja excluir ${studentToDelete.name}? Essa ação não poderá ser desfeita.`
                : "Tem certeza que deseja excluir este aluno?"}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteOpen(false)}>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault();
                await onConfirmDelete();
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
