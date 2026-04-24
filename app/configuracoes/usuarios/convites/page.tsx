import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { UserInvitesSection } from "@/components/configuracoes/sections/user-invites-section";

export default function ConfiguracoesUsuariosConvitesPage() {
  return (
    <SettingsShell
      title="Usuários"
      description="Gerencie usuários, permissões e convites do sistema."
    >
      <UserInvitesSection />
    </SettingsShell>
  );
}