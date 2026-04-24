import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AccountSettingsSection } from "@/components/configuracoes/sections/account-settings-section";

export default function ConfiguracoesContaPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Gerencie sua conta e preferências do sistema."
    >
      <AccountSettingsSection />
    </SettingsShell>
  );
}