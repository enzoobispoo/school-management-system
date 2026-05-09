"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export class ValidationError extends Error {
  field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.field = field;
  }
}

interface StudentPayload {
  [key: string]: unknown;
}

export function useStudentsActions(onSuccess: () => Promise<void>) {
  const { t } = useDashboardLanguage();
  const [submitting, setSubmitting] = useState(false);

  async function handleCreateStudent(payload: StudentPayload) {
    try {
      setSubmitting(true);
      const response = await fetch("/api/alunos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new ValidationError(result.error || t("students.actions.createFail"), result.field);
      toast.success(t("students.actions.created"));
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateStudent(id: string, payload: StudentPayload) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/alunos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok)
        throw new ValidationError(result.error || t("students.actions.updateFail"), result.field);
      toast.success(t("students.actions.updated"));
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteStudent(id: string) {
    try {
      setSubmitting(true);
      const response = await fetch(`/api/alunos/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || t("students.actions.deleteFail"));
      toast.success(t("students.actions.deleted"));
      await onSuccess();
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, setSubmitting, handleCreateStudent, handleUpdateStudent, handleDeleteStudent };
}