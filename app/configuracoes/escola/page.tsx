import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { SchoolSettingsSection } from "@/components/configuracoes/sections/school-settings-section";

export default function ConfiguracoesEscolaPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.general"
    >
      <SchoolSettingsSection />
    </SettingsShell>
  );
}