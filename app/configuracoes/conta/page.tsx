import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AccountSettingsSection } from "@/components/configuracoes/sections/account-settings-section";

export default function ConfiguracoesContaPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.account"
    >
      <AccountSettingsSection />
    </SettingsShell>
  );
}