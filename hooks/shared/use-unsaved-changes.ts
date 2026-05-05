"use client";

/**
 * Retorna uma função `guardClose` que, se o form tiver dados não salvos,
 * exibe um confirm antes de fechar. Caso contrário, fecha direto.
 */
export function useUnsavedChanges(isDirty: boolean) {
  function guardClose(close: () => void) {
    if (!isDirty) { close(); return; }
    if (confirm("Você tem alterações não salvas. Deseja sair mesmo assim?")) close();
  }
  return { guardClose };
}
