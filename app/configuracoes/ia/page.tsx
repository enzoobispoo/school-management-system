import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AiSettingsSection } from "@/components/configuracoes/sections/ai-settings-section";

export default function ConfiguracoesIAPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.ai"
    >
      <AiSettingsSection />
    </SettingsShell>
  );
}