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

export default function LoginPage() {
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
      if (!response.ok) throw new Error(result.error || "Não foi possível fazer login.");
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível fazer login.");
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
      // independente do resultado, mostra mensagem genérica (segurança)
      toast.success("Se esse e-mail estiver cadastrado, você receberá as instruções em breve.");
      setForgotOpen(false);
      setForgotEmail("");
    } catch {
      toast.success("Se esse e-mail estiver cadastrado, você receberá as instruções em breve.");
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
          <h1 className="text-[22px] font-semibold tracking-tight text-foreground">Entrar</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Acesse o sistema de gestão de {schoolName}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <div className="grid gap-1.5">
            <label className="text-[13px] font-medium text-foreground">Usuário ou e-mail</label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com ou usuario"
              className="h-11 rounded-2xl"
              autoComplete="username"
            />
          </div>

          <div className="grid gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[13px] font-medium text-foreground">Senha</label>
              <button
                type="button"
                onClick={() => setForgotOpen(true)}
                className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
              >
                Esqueci minha senha
              </button>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
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
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>

      {/* Modal recuperação de senha */}
      <Dialog open={forgotOpen} onOpenChange={(v) => { setForgotOpen(v); if (!v) setForgotEmail(""); }}>
        <DialogContent className="max-w-[300px] rounded-[28px]">
          <DialogHeader>
            <DialogTitle>Recuperar senha</DialogTitle>
            <DialogDescription>
              Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha. O link expira em 1 hora.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleForgotPassword} className="grid gap-3">
            <Input
              type="email"
              placeholder="seu@email.com"
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
              {forgotLoading ? "Enviando..." : "Enviar link"}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Lembrou a senha?{" "}
              <button
                type="button"
                onClick={() => { setForgotOpen(false); setForgotEmail(""); }}
                className="font-medium text-foreground hover:underline"
              >
                Voltar ao login
              </button>
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
