import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { UsersSettingsSection } from "@/components/configuracoes/sections/users-settings-section";

export default function ConfiguracoesUsuariosPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.usersTitle"
      descriptionKey="settings.shell.usersDesc"
    >
      <UsersSettingsSection />
    </SettingsShell>
  );
}