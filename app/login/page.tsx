"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const router = useRouter();

  const [schoolName, setSchoolName] = useState("EduGestão");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSchoolName() {
      try {
        const response = await fetch("/api/configuracoes/escola/public", {
          cache: "no-store",
        });

        const result = await response.json();

        if (response.ok && result?.nome) {
          setSchoolName(result.nome);
        }
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível fazer login.");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível fazer login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
      <div className="w-full max-w-md rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black">
            Entrar
          </h1>
          <p className="mt-2 text-sm text-black/55">
            Acesse o sistema de gestão escolar de {schoolName}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">
              Usuário ou e-mail
            </label>
            <Input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com ou usuario"
              className="h-11 rounded-2xl"
              autoComplete="username"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha"
              className="h-11 rounded-2xl"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={loading}
            className="mt-2 h-11 rounded-2xl bg-black text-white hover:bg-black/90"
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </div>
    </main>
  );
}