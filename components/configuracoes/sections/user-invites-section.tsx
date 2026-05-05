"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { useUserInvites } from "@/hooks/configuracoes/use-user-invites";

type UserRole = "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador", FINANCEIRO: "Financeiro",
  SECRETARIA: "Secretaria", PROFESSOR: "Professor",
};

interface ConvitePendente {
  id: string;
  email: string;
  role: string;
  schoolId: string | null;
  school: { nome: string; slug: string } | null;
  expiresAt: string;
  createdAt: string;
}

export function UserInvitesSection() {
  const {
    email,
    setEmail,
    role,
    setRole,
    inviteLink,
    loading,
    error,
    success,
    schools,
    schoolId,
    setSchoolId,
    loadingSchools,
    handleCreateInvite,
    handleCopy,
  } = useUserInvites();
  const [convites, setConvites] = useState<ConvitePendente[]>([]);
  const [loadingConvites, setLoadingConvites] = useState(true);
  const [reenviando, setReenviando] = useState<string | null>(null);

  async function fetchConvites() {
    try {
      const res = await fetch("/api/auth/invites", { cache: "no-store" });
      if (res.ok) setConvites(await res.json());
    } finally {
      setLoadingConvites(false);
    }
  }

  useEffect(() => { fetchConvites(); }, []);

  async function handleReenviar(convite: ConvitePendente) {
    setReenviando(convite.id);
    try {
      const res = await fetch("/api/auth/invites/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: convite.id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Erro ao reenviar convite"); return; }
      toast.success(`Convite reenviado para ${convite.email}`);
      fetchConvites();
    } finally {
      setReenviando(null);
    }
  }

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Convites</h2>
          <p className="mt-1 text-sm text-muted-foreground">Gere um link seguro para convidar novos usuários.</p>
        </div>
        <Link href="/configuracoes/usuarios" className="rounded-2xl border border-border px-4 py-2 text-sm text-foreground hover:bg-accent">
          Voltar para usuários
        </Link>
      </div>

      {/* Formulário novo convite */}
      <div className="grid gap-4">
        {loadingSchools ? (
          <p className="text-sm text-muted-foreground">Carregando escolas...</p>
        ) : schools.length === 0 ? (
          <p className="text-sm text-destructive">
            Nenhuma escola disponível. Cadastre uma escola antes de enviar convites.
          </p>
        ) : (
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Escola</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} ({s.slug})
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">E-mail</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="cliente@empresa.com" className="h-11 rounded-2xl" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-foreground">Perfil</label>
          <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none">
            <option value="ADMIN">Administrador</option>
            <option value="FINANCEIRO">Financeiro</option>
            <option value="SECRETARIA">Secretaria</option>
            <option value="PROFESSOR">Professor</option>
          </select>
        </div>
        <Button
          onClick={handleCreateInvite}
          disabled={loading || loadingSchools || schools.length === 0 || !schoolId}
          className="h-8 w-fit rounded-md px-4"
        >
          {loading ? "Criando..." : "Criar convite"}
        </Button>

        {inviteLink && (
          <div className="rounded-[24px] border border-border bg-muted/30 p-4">
            <p className="text-sm font-medium text-foreground">Link de convite gerado</p>
            <p className="mt-2 break-all text-sm text-muted-foreground">{inviteLink}</p>
            <Button variant="outline" onClick={handleCopy} className="mt-4 h-10 rounded-2xl">Copiar link</Button>
          </div>
        )}
        <SettingsFeedback error={error} success={success} />
      </div>

      {/* Convites pendentes */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-foreground">Convites pendentes</h3>
        {loadingConvites ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : convites.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum convite pendente.</p>
        ) : (
          <div className="space-y-2">
            {convites.map((c) => {
              const expirado = isExpired(c.expiresAt);
              return (
                <div key={c.id} className="flex items-center justify-between rounded-[20px] border border-border bg-muted/20 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.school?.nome ?? "Escola"} · {roleLabel[c.role] ?? c.role} ·{" "}
                      {expirado ? (
                        <span className="text-destructive">Expirado</span>
                      ) : (
                        <span>Expira em {new Date(c.expiresAt).toLocaleDateString("pt-BR")}</span>
                      )}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-2xl shrink-0"
                    disabled={reenviando === c.id}
                    onClick={() => handleReenviar(c)}
                  >
                    {reenviando === c.id ? "Enviando..." : "Reenviar"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
