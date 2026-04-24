import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { UsersSettingsSection } from "@/components/configuracoes/sections/users-settings-section";

export default function ConfiguracoesUsuariosPage() {
  return (
    <SettingsShell
      title="Usuários"
      description="Gerencie usuários e permissões do sistema."
    >
      <UsersSettingsSection />
    </SettingsShell>
  );
}