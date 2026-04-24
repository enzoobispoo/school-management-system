import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { DashboardSettingsSection } from "@/components/configuracoes/sections/dashboard-settings-section";

export default function ConfiguracoesDashboardPage() {
  return (
    <SettingsShell
      title="Dashboard"
      description="Configure o comportamento e as preferências do dashboard."
    >
      <DashboardSettingsSection />
    </SettingsShell>
  );
}