import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { NotificationsSettingsSection } from "@/components/configuracoes/sections/notifications-settings-section";

export default function ConfiguracoesNotificacoesPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Gerencie dados da escola, financeiro, IA e preferências."
    >
      <NotificationsSettingsSection />
    </SettingsShell>
  );
}