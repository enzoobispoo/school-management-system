"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { defaultHomePathForRole } from "@/lib/navigation/default-home";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

export default function LoginPage() {
  const { t } = useDashboardLanguage();
  const router = useRouter();

  const [schoolName, setSchoolName] = useState("EduGestão");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("motivo") !== "portal_docente") return;
    toast.message(t("login.portalDisabled.title"), {
      description: t("login.portalDisabled.description"),
    });
    params.delete("motivo");
    const qs = params.toString();
    window.history.replaceState(
      {},
      "",
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [t]);

  useEffect(() => {
    async function loadSchoolName() {
      try {
        const response = await fetch("/api/configuracoes/escola/public", { cache: "no-store" });
        const result = await response.json();
        if (response.ok && result?.nome) setSchoolName(result.nome);
      } catch {
        setSchoolName("EduGestão");
      }
    }
    loadSchoolName();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (response.status === 429) {
        throw new Error(result.error || t("login.error.rateLimit"));
      }
      if (
        response.status === 403 &&
        result?.code === "PROFESSOR_PORTAL_DISABLED"
      ) {
        throw new Error(result.error || t("login.error.portalDisabled"));
      }
      if (!response.ok) throw new Error(result.error || t("login.error.failed"));

      const role = result?.user?.role as string | undefined;
      router.push(defaultHomePathForRole(role));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error.failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        toast.error((data as { error?: string }).error || t("login.forgot.rateLimit"));
        return;
      }
      // mensagem genérica (senão vaza se o e-mail existe)
      toast.success(t("login.forgot.confirmEmailSent"));
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.success(t("login.forgot.confirmEmailSent"));
      setForgotOpen(false);
      setForgotEmail("");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            {t("login.title")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("login.subtitle", { school: schoolName })}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <label className="text-[13px] font-medium text-foreground">
              {t("login.emailLabel")}
            </label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("login.emailPlaceholder")}
              className="h-11 rounded-2xl"
              autoComplete="username"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">
                {t("login.passwordLabel")}
              </label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t("login.forgotPasswordLink")}
              </button>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("login.passwordPlaceholder")}
              className="h-11 rounded-2xl"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 h-10 rounded-lg bg-foreground px-5 text-[13px] text-background hover:opacity-90"
          >
            {loading ? t("login.submit.loading") : t("login.submit.enter")}
          </Button>
        </form>
      </div>

      {/* Modal recuperação de senha */}
      <Dialog open={forgotOpen} onOpenChange={(v) => { setForgotOpen(v); if (!v) setForgotEmail(""); }}>
        <DialogContent className="max-w-[300px] rounded-[28px]">
          <DialogHeader>
            <DialogTitle>{t("login.dialog.recoverTitle")}</DialogTitle>
            <DialogDescription>{t("login.dialog.recoverDescription")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="grid gap-3">
            <Input
              type="email"
              placeholder={t("login.dialog.emailPlaceholder")}
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              className="h-11 rounded-2xl"
              autoFocus
            />
            <Button
              type="submit"
              className="h-10 rounded-2xl"
              disabled={forgotLoading || !forgotEmail.trim()}
            >
              {forgotLoading ? t("login.dialog.sending") : t("login.dialog.sendLink")}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              {t("login.dialog.rememberedPrompt")}{" "}
              <button
                type="button"
                onClick={() => { setForgotOpen(false); setForgotEmail(""); }}
                className="font-medium text-foreground hover:underline"
              >
                {t("login.dialog.backToLogin")}
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
