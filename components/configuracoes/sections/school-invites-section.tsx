"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SettingsFeedback } from "@/components/configuracoes/shared/settings-feedback";
import { InviteRoleHint } from "@/components/configuracoes/invite-role-hint";

type SchoolInviteRole =
  | "FINANCEIRO"
  | "SECRETARIA"
  | "SECRETARIA_FINANCEIRA"
  | "PROFESSOR";

type ConviteRow = {
  id: string;
  email: string;
  role: string;
  schoolId: string | null;
  expiresAt: string;
  createdAt: string;
  school: { nome: string; slug: string } | null;
};

type Quota = {
  limiteUsuarios: number | null;
  activeUsers: number;
  pendingInvites: number;
  remaining: number | null;
};

export function SchoolInvitesSection() {
  const { t } = useDashboardLanguage();

  const ROLE_OPTIONS = useMemo(
    (): { value: SchoolInviteRole; label: string }[] => [
      { value: "SECRETARIA", label: t("invites.role.secretariaAcademic") },
      {
        value: "SECRETARIA_FINANCEIRA",
        label: t("invites.role.secretariaFinance"),
      },
      { value: "FINANCEIRO", label: t("invites.role.financeiro") },
      { value: "PROFESSOR", label: t("invites.role.professor") },
    ],
    [t]
  );

  const ROLE_LABEL = useMemo(
    (): Record<string, string> => ({
      FINANCEIRO: t("invites.role.financeiro"),
      SECRETARIA: t("invites.role.secretariaAcademic"),
      SECRETARIA_FINANCEIRA: t("invites.role.secretariaFinance"),
      PROFESSOR: t("invites.role.professor"),
    }),
    [t]
  );

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<SchoolInviteRole>("SECRETARIA");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [inviteLink, setInviteLink] = useState("");

  const [convites, setConvites] = useState<ConviteRow[]>([]);
  const [quota, setQuota] = useState<Quota | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [reenviando, setReenviando] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      setLoadingList(true);
      const res = await fetch("/api/auth/invites", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : t("invites.school.loadGenericError")
        );
      }
      setConvites(Array.isArray(data) ? data : (data.invites ?? []));
      setQuota(data.quota ?? null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("invites.school.loadError"));
    } finally {
      setLoadingList(false);
    }
  }, [t]);

  useEffect(() => {
    async function gate() {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        const ok = res.ok && data.user?.role === "ADMIN";
        setAllowed(ok);
        if (ok) await loadAll();
      } finally {
        setChecking(false);
      }
    }
    gate();
  }, [loadAll]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setInviteLink("");
    try {
      const em = email.trim().toLowerCase();
      if (!em) {
        setError(t("invites.form.emailRequired"));
        return;
      }

      const res = await fetch("/api/auth/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: em, role }),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || t("invites.form.createFail"));
      }
      setSuccess(t("invites.form.successSent"));
      if (typeof result.inviteLink === "string") setInviteLink(result.inviteLink);
      if (result.quota) setQuota(result.quota);
      setEmail("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("invites.form.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    toast.success(t("invites.school.linkCopied"));
  }

  async function handleReenviar(c: ConviteRow) {
    setReenviando(c.id);
    try {
      const res = await fetch("/api/auth/invites/reenviar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: c.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("invites.school.resendError"));
        return;
      }
      toast.success(t("invites.school.resendSuccess"));
      if (typeof data.inviteLink === "string") {
        setInviteLink(data.inviteLink);
        setSuccess(t("invites.form.newLinkHint"));
      }
      await loadAll();
    } finally {
      setReenviando(null);
    }
  }

  async function handleCancelar(c: ConviteRow) {
    setCancelando(c.id);
    try {
      const res = await fetch("/api/auth/invites/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId: c.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("invites.school.cancelError"));
        return;
      }
      toast.success(t("invites.school.cancelSuccess"));
      await loadAll();
    } finally {
      setCancelando(null);
    }
  }

  if (checking) {
    return <p className="text-sm text-muted-foreground">{t("common.loading")}</p>;
  }

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
        {t("invites.school.adminOnly")}
      </div>
    );
  }

  const quotaLine =
    quota ?
      quota.limiteUsuarios == null ?
        t("invites.school.quotaUnlimited", {
          activeUsers: quota.activeUsers,
          pendingInvites: quota.pendingInvites,
        })
      : t("invites.school.quotaLimited", {
          activeUsers: quota.activeUsers,
          limiteUsuarios: quota.limiteUsuarios,
          pendingInvites: quota.pendingInvites,
          remaining: quota.remaining ?? 0,
        })
    : null;

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date();

  return (
    <div className="grid gap-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t("invites.school.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("invites.school.subtitle")}</p>
        {quotaLine ? (
          <p className="mt-3 text-[13px] text-foreground/80">{quotaLine}</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="grid max-w-xl gap-4 rounded-[24px] border border-border bg-muted/20 p-5">
        <div className="grid gap-2">
          <Label htmlFor="invite-email">{t("invites.school.emailLabel")}</Label>
          <Input
            id="invite-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("invites.school.emailPlaceholder")}
            className="h-11 rounded-2xl"
            autoComplete="off"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="invite-role">{t("invites.school.roleLabel")}</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value as SchoolInviteRole)}
            className="h-11 rounded-2xl border border-border bg-background px-3 text-sm text-foreground outline-none"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <InviteRoleHint role={role} />
        </div>

        <Button type="submit" disabled={loading} className="h-10 w-fit rounded-xl">
          {loading ? t("invites.school.submitLoading") : t("invites.school.submitIdle")}
        </Button>

        <SettingsFeedback error={error} success={success} />

        {inviteLink ? (
          <div className="grid gap-2 rounded-2xl border border-border bg-background px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">
              {t("invites.school.directLink")}
            </p>
            <p className="break-all font-mono text-[12px] text-foreground">{inviteLink}</p>
            <Button type="button" variant="outline" className="h-9 w-fit rounded-xl" onClick={handleCopy}>
              {t("invites.school.copyLink")}
            </Button>
          </div>
        ) : null}
      </form>

      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-foreground">{t("invites.school.pendingTitle")}</h3>
        {loadingList ?
          <p className="text-sm text-muted-foreground">{t("invites.school.loadingList")}</p>
        : convites.length === 0 ?
          <p className="text-sm text-muted-foreground">{t("invites.school.noPending")}</p>
        : (
          <ul className="grid gap-2">
            {convites.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{c.email}</p>
                  <p className="text-[13px] text-muted-foreground">
                    {ROLE_LABEL[c.role] ?? c.role}
                    {isExpired(c.expiresAt) ?
                      <span className="text-amber-600 dark:text-amber-400">
                        {" "}
                        · {t("invites.school.expired")}
                      </span>
                    : null}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    disabled={reenviando === c.id}
                    onClick={() => handleReenviar(c)}
                  >
                    {reenviando === c.id ? "..." : t("invites.school.resend")}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-xl text-destructive hover:text-destructive"
                    disabled={cancelando === c.id}
                    onClick={() => handleCancelar(c)}
                  >
                    {cancelando === c.id ? "..." : t("chat.dialog.cancel")}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
