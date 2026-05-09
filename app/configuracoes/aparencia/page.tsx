import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AppearanceSettingsSection } from "@/components/configuracoes/sections/appearance-settings-section";

export default function ConfiguracoesAparenciaPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.appearance"
    >
      <AppearanceSettingsSection />
    </SettingsShell>
  );
}