import { redirect } from "next/navigation";

/** Convites de acesso são geridos em Configurações do painel admin (super admin). */
export default function ConvitesRedirectPage() {
  redirect("/admin/configuracoes?tab=convites");
}
