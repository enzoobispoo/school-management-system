import { SettingsShell } from "@/components/configuracoes/settings-shell";
import { AiSettingsSection } from "@/components/configuracoes/sections/ai-settings-section";

export default function ConfiguracoesIAPage() {
  return (
    <SettingsShell
      title="Configurações"
      description="Chaves OpenAI, Twilio e limites conforme o plano da sua escola."
    >
      <AiSettingsSection />
    </SettingsShell>
  );
}