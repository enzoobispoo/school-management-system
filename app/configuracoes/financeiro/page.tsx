import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { FinancialSettingsSection } from "@/components/configuracoes/sections/financial-settings-section";

export default function ConfiguracoesFinanceiroPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.general"
    >
      <FinancialSettingsSection />
    </SettingsShell>
  );
}