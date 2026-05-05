"use client";

import { useEffect, useState } from "react";
import { ValidationError } from "@/hooks/alunos/use-students-actions";
import { useUnsavedChanges } from "@/hooks/shared/use-unsaved-changes";
import { cpf as cpfValidator } from "cpf-cnpj-validator";

export interface StudentFormData {
  nome: string;
  email: string;
  cpf: string;
  telefone: string;
  dataNascimento: string;
  endereco: string;
  responsavelNome: string;
  responsavelTelefone: string;
  responsavelEmail: string;
  responsavelCpf: string;
  // saúde
  possuiLaudo: boolean;
  laudoDescricao: string;
  laudoCid: string;
  laudoTipo: string;
  laudoNivel: string;
  laudoProfissional: string;
  laudoData: string;
  alergias: string;
  medicamentos: string;
  condicoesCronicas: string;
  planoSaude: string;
  contatoEmergenciaNome: string;
  contatoEmergenciaTelefone: string;
  adaptacaoNecessaria: boolean;
  adaptacaoDescricao: string;
  observacoesMedicas: string;
  observacoesProf: string;
  tratamentos: string;
  // extras
  status: string;
  observacoesGerais: string;
  indicacao: string;
  nivelInicial: string;
  idiomaNativo: string;
  motivoSaida: string;
  dataSaida: string;
}

const emptyForm: StudentFormData = {
  nome: "", email: "", cpf: "", telefone: "", dataNascimento: "", endereco: "",
  responsavelNome: "", responsavelTelefone: "", responsavelEmail: "", responsavelCpf: "",
  possuiLaudo: false, laudoDescricao: "", laudoCid: "", laudoTipo: "",
  laudoNivel: "", laudoProfissional: "", laudoData: "",
  alergias: "", medicamentos: "", condicoesCronicas: "", planoSaude: "",
  contatoEmergenciaNome: "", contatoEmergenciaTelefone: "",
  adaptacaoNecessaria: false, adaptacaoDescricao: "",
  observacoesMedicas: "", observacoesProf: "", tratamentos: "",
  status: "ATIVO", observacoesGerais: "", indicacao: "",
  nivelInicial: "", idiomaNativo: "", motivoSaida: "", dataSaida: "",
};

interface UseStudentModalParams {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialData?: Partial<StudentFormData> | null;
  onSubmit: (payload: Partial<StudentFormData> & { nome: string }) => Promise<void>;
}

function formatCpf(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10)
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

const fieldToTab: Record<string, "dados" | "responsavel" | "saude" | "extras"> = {
  nome: "dados", email: "dados", cpf: "dados", telefone: "dados",
  dataNascimento: "dados", endereco: "dados",
  responsavelNome: "responsavel", responsavelTelefone: "responsavel",
  responsavelEmail: "responsavel", responsavelCpf: "responsavel",
  possuiLaudo: "saude", laudoDescricao: "saude", laudoCid: "saude",
  laudoTipo: "saude", laudoNivel: "saude", laudoProfissional: "saude",
  laudoData: "saude", alergias: "saude", medicamentos: "saude",
  condicoesCronicas: "saude", planoSaude: "saude",
  contatoEmergenciaNome: "saude", contatoEmergenciaTelefone: "saude",
  adaptacaoNecessaria: "saude", adaptacaoDescricao: "saude",
  observacoesMedicas: "saude", observacoesProf: "saude",
  status: "extras", observacoesGerais: "extras", indicacao: "extras",
  nivelInicial: "extras", idiomaNativo: "extras", motivoSaida: "extras", dataSaida: "extras",
};

export function useStudentModal({ open, onOpenChange, initialData = null, onSubmit }: UseStudentModalParams) {
  const isControlled = open !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const [error, setError] = useState("");
  const [errorField, setErrorField] = useState<string | undefined>();
  const [errorTab, setErrorTab] = useState<"dados" | "responsavel" | "saude" | "extras" | undefined>();
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [initialForm, setInitialForm] = useState<StudentFormData>(emptyForm);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const { guardClose } = useUnsavedChanges(isDirty);

  const currentOpen = isControlled ? open : internalOpen;

  function setCurrentOpen(next: boolean) {
    if (isControlled) onOpenChange?.(next);
    else setInternalOpen(next);
  }

  useEffect(() => {
    if (currentOpen) {
      const filled = {
        ...emptyForm,
        nome: initialData?.nome ?? "",
        email: initialData?.email ?? "",
        cpf: initialData?.cpf ? formatCpf(initialData.cpf) : "",
        telefone: initialData?.telefone ? formatPhone(initialData.telefone) : "",
        dataNascimento: initialData?.dataNascimento ?? "",
        endereco: initialData?.endereco ?? "",
        responsavelNome: initialData?.responsavelNome ?? "",
        responsavelTelefone: initialData?.responsavelTelefone
          ? formatPhone(initialData.responsavelTelefone) : "",
        responsavelEmail: initialData?.responsavelEmail ?? "",
        responsavelCpf: initialData?.responsavelCpf ? formatCpf(initialData.responsavelCpf) : "",
        possuiLaudo: initialData?.possuiLaudo ?? false,
        laudoDescricao: initialData?.laudoDescricao ?? "",
        laudoCid: initialData?.laudoCid ?? "",
        laudoTipo: initialData?.laudoTipo ?? "",
        laudoNivel: initialData?.laudoNivel ?? "",
        laudoProfissional: initialData?.laudoProfissional ?? "",
        laudoData: initialData?.laudoData ?? "",
        alergias: initialData?.alergias ?? "",
        medicamentos: initialData?.medicamentos ?? "",
        condicoesCronicas: initialData?.condicoesCronicas ?? "",
        planoSaude: initialData?.planoSaude ?? "",
        contatoEmergenciaNome: initialData?.contatoEmergenciaNome ?? "",
        contatoEmergenciaTelefone: initialData?.contatoEmergenciaTelefone
          ? formatPhone(initialData.contatoEmergenciaTelefone) : "",
        adaptacaoNecessaria: initialData?.adaptacaoNecessaria ?? false,
        adaptacaoDescricao: initialData?.adaptacaoDescricao ?? "",
        observacoesMedicas: initialData?.observacoesMedicas ?? "",
        observacoesProf: initialData?.observacoesProf ?? "",
        tratamentos: initialData?.tratamentos ?? "",
        status: initialData?.status ?? "ATIVO",
        observacoesGerais: initialData?.observacoesGerais ?? "",
        indicacao: initialData?.indicacao ?? "",
        nivelInicial: initialData?.nivelInicial ?? "",
        idiomaNativo: initialData?.idiomaNativo ?? "",
        motivoSaida: initialData?.motivoSaida ?? "",
        dataSaida: initialData?.dataSaida ?? "",
      };
      setForm(filled);
      setInitialForm(filled);
      setError("");
    }
  }, [currentOpen, initialData]);

  function updateField(field: keyof StudentFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateBoolField(field: "possuiLaudo" | "adaptacaoNecessaria", value: boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function closeModal() {
    guardClose(() => {
      setCurrentOpen(false);
      setForm(emptyForm);
      setInitialForm(emptyForm);
      setError("");
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setErrorField(undefined);
    setErrorTab(undefined);

    if (!form.nome.trim()) {
      setError("Nome é obrigatório.");
      setErrorField("nome");
      setErrorTab("dados");
      return;
    }

    // valida CPF se preenchido
    const cpfDigits = form.cpf.replace(/\D/g, "");
    if (cpfDigits && !cpfValidator.isValid(cpfDigits)) {
      setError("CPF inválido. Verifique os dígitos informados.");
      setErrorField("cpf");
      setErrorTab("dados");
      return;
    }

    // valida CPF do responsável se preenchido
    const respCpfDigits = form.responsavelCpf.replace(/\D/g, "");
    if (respCpfDigits && !cpfValidator.isValid(respCpfDigits)) {
      setError("CPF do responsável inválido.");
      setErrorField("responsavelCpf");
      setErrorTab("responsavel");
      return;
    }

    try {
      await onSubmit({
        nome: form.nome.trim(),
        email: form.email.trim() || undefined,
        cpf: form.cpf.trim() || undefined,
        telefone: form.telefone.trim() || undefined,
        dataNascimento: form.dataNascimento || undefined,
        endereco: form.endereco.trim() || undefined,
        responsavelNome: form.responsavelNome.trim() || undefined,
        responsavelTelefone: form.responsavelTelefone.trim() || undefined,
        responsavelEmail: form.responsavelEmail.trim() || undefined,
        responsavelCpf: form.responsavelCpf.trim() || undefined,
        possuiLaudo: form.possuiLaudo,
        laudoDescricao: form.laudoDescricao.trim() || undefined,
        laudoCid: form.laudoCid.trim() || undefined,
        laudoTipo: form.laudoTipo.trim() || undefined,
        laudoNivel: form.laudoNivel.trim() || undefined,
        laudoProfissional: form.laudoProfissional.trim() || undefined,
        laudoData: form.laudoData || undefined,
        alergias: form.alergias.trim() || undefined,
        medicamentos: form.medicamentos.trim() || undefined,
        condicoesCronicas: form.condicoesCronicas.trim() || undefined,
        planoSaude: form.planoSaude.trim() || undefined,
        contatoEmergenciaNome: form.contatoEmergenciaNome.trim() || undefined,
        contatoEmergenciaTelefone: form.contatoEmergenciaTelefone.trim() || undefined,
        adaptacaoNecessaria: form.adaptacaoNecessaria,
        adaptacaoDescricao: form.adaptacaoDescricao.trim() || undefined,
        observacoesMedicas: form.observacoesMedicas.trim() || undefined,
        observacoesProf: form.observacoesProf.trim() || undefined,
        tratamentos: form.tratamentos.trim() || undefined,
        status: form.status || undefined,
        observacoesGerais: form.observacoesGerais.trim() || undefined,
        indicacao: form.indicacao.trim() || undefined,
        nivelInicial: form.nivelInicial.trim() || undefined,
        idiomaNativo: form.idiomaNativo.trim() || undefined,
        motivoSaida: form.motivoSaida.trim() || undefined,
        dataSaida: form.dataSaida || undefined,
      });

      setForm(emptyForm);
      setInitialForm(emptyForm);
      setCurrentOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível salvar o aluno.";
      const field = err instanceof ValidationError ? err.field : undefined;
      setError(message);
      setErrorField(field);
      setErrorTab(field ? fieldToTab[field] : undefined);
    }
  }

  return { currentOpen, setCurrentOpen, form, error, errorField, errorTab, updateField, updateBoolField, closeModal, handleSubmit, formatCpf, formatPhone, isDirty, guardClose };
}
