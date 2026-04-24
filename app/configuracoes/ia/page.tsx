import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AiSettingsSection } from "@/components/configuracoes/sections/ai-settings-section";

export default function ConfiguracoesIAPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Gerencie dados da escola, financeiro, IA e preferências."
    >
      <AiSettingsSection />
    </SettingsShell>
  );
}