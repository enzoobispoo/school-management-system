import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { SchoolInvitesSection } from "@/components/configuracoes/sections/school-invites-section";

export default function ConfiguracoesConvitesEquipePage() {
  return (
    <SettingsShell
      titleKey="settings.shell.invitesTitle"
      descriptionKey="settings.shell.invitesDesc"
    >
      <SchoolInvitesSection />
    </SettingsShell>
  );
}
