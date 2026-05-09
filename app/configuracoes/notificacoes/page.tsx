import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { NotificationsSettingsSection } from "@/components/configuracoes/sections/notifications-settings-section";

export default function ConfiguracoesNotificacoesPage() {
  return (
    <SettingsShell
      titleKey="settings.shell.title"
      descriptionKey="settings.shell.desc.general"
    >
      <NotificationsSettingsSection />
    </SettingsShell>
  );
}