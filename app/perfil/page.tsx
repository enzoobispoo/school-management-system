"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { AccountSettingsSection } from "@/components/configuracoes/sections/account-settings-section";
import { Button } from "@/components/ui/button";

export default function PerfilPage() {
  const [backHref, setBackHref] = useState("/");

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { user?: { role?: string } }) => {
        const role = d.user?.role;
        if (role === "PROFESSOR") setBackHref("/docente");
        else if (role === "SUPER_ADMIN") setBackHref("/admin");
        else setBackHref("/");
      })
      .catch(() => setBackHref("/"));
  }, []);

  return (
    <DashboardLayout>
      <Header
        title="Meu perfil"
        description="Nome, foto, telefone e e-mail aparecem no chat e em outros lugares do sistema."
      />

      <div className="mx-auto max-w-2xl space-y-4 p-5">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Voltar ao painel
          </Link>
        </Button>

        <div className="rounded-xl border border-border/60 bg-card p-6 text-card-foreground">
          <AccountSettingsSection />
        </div>
      </div>
    </DashboardLayout>
  );
}
