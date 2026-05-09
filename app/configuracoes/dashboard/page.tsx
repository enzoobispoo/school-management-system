import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { DashboardSettingsSection } from "@/components/configuracoes/sections/dashboard-settings-section";

export default function ConfiguracoesDashboardPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.dashboardPageTitle"
      descriptionKey="settings.shell.dashboardPageDesc"
    >
      <DashboardSettingsSection />
    </SettingsShell>
  );
}