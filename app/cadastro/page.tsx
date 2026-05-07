"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PASSWORD_MIN_LENGTH } from "@/lib/validations/password-policy";

export default function CadastroPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nomeEscola: "", nome: "", email: "", password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (form.password.length < PASSWORD_MIN_LENGTH) {
      setError(
        `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nomeEscola: form.nomeEscola,
          nome: form.nome,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao criar conta."); return; }

      router.push("/");
    } catch {
      setError("Não foi possível criar a conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Criar sua conta</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure seu sistema de gestão escolar em minutos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Nome da escola</label>
            <input
              type="text"
              value={form.nomeEscola}
              onChange={(e) => update("nomeEscola", e.target.value)}
              placeholder="Ex: Centro de Formação Alpha"
              required
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Seu nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Nome completo"
              required
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="voce@escola.com"
              required
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Mínimo 8 caracteres"
              required
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          <div className="grid gap-1.5">
            <label className="text-sm font-medium text-foreground">Confirmar senha</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Repita a senha"
              required
              className="h-11 rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {error && (
            <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="h-11 rounded-2xl bg-foreground text-background text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
          >
            {loading ? "Criando conta..." : "Criar conta grátis"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Já tem uma conta?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
