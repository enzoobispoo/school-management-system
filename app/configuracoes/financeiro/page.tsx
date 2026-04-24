import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { FinancialSettingsSection } from "@/components/configuracoes/sections/financial-settings-section";

export default function ConfiguracoesFinanceiroPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Gerencie dados da escola, financeiro, IA e preferências."
    >
      <FinancialSettingsSection />
    </SettingsShell>
  );
}