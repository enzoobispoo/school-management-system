"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/password-policy";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    setError("");
    fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`)
      .then((r) => {
        if (r.status === 429) {
          setValid(false);
          setError(
            "Muitas tentativas de validação. Aguarde alguns minutos e abra o link do e-mail novamente."
          );
          return null;
        }
        return r.json();
      })
      .then((d) => {
        if (!d) return;
        setValid(Boolean(d.valid));
      })
      .finally(() => setValidating(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < PASSWORD_MIN_LENGTH) {
      setError(
        `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
      );
      return;
    }
    if (password !== confirm) { setError("As senhas não coincidem."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.status === 429) {
        throw new Error(
          data.error ||
            "Muitas tentativas. Aguarde alguns minutos e tente novamente."
        );
      }
      if (!res.ok) throw new Error(data.error || "Erro ao redefinir senha.");
      setDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <div className="text-sm text-muted-foreground">Validando link...</div>
    );
  }

  if (!valid) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error ||
            "Este link é inválido ou já expirou. Solicite um novo na tela de login."}
        </div>
        <Button className="w-full rounded-2xl" onClick={() => router.push("/login")}>
          Voltar ao login
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:text-emerald-400">
          Senha redefinida com sucesso! Redirecionando para o login...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <div className="grid gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Nova senha</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={`Mínimo ${PASSWORD_MIN_LENGTH} caracteres`}
          className="h-11 rounded-2xl"
          autoFocus
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-[13px] font-medium text-foreground">Confirmar senha</label>
        <Input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repita a nova senha"
          className="h-11 rounded-2xl"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={loading} className="mt-1 h-10 rounded-2xl">
        {loading ? "Salvando..." : "Redefinir senha"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
            Redefinir senha
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Crie uma nova senha para sua conta.
          </p>
        </div>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Carregando...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </main>
  );
}
