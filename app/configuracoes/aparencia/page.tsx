import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AppearanceSettingsSection } from "@/components/configuracoes/sections/appearance-settings-section";

export default function ConfiguracoesAparenciaPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Personalize a aparência do sistema."
    >
      <AppearanceSettingsSection />
    </SettingsShell>
  );
}