import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { SchoolSettingsSection } from "@/components/configuracoes/sections/school-settings-section";

export default function ConfiguracoesEscolaPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Gerencie dados da escola, financeiro, IA e preferências."
    >
      <SchoolSettingsSection />
    </SettingsShell>
  );
}