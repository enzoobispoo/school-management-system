"use client";

export function AiSettingsSection() {
  return (
    <div className="grid gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">IA</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          As configurações de IA são gerenciadas pela plataforma e configuradas
          individualmente por usuário na aba{" "}
          <span className="font-medium text-foreground">Usuários</span>.
        </p>
      </div>
    </div>
  );
}
