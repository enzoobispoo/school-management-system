"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AcceptInviteFormProps {
  token: string;
}

interface InviteResponse {
  invite?: {
    email: string;
    role: "ADMIN" | "FINANCEIRO" | "SECRETARIA" | "PROFESSOR";
    schoolName: string;
    expiresAt: string;
  };
  error?: string;
}

function formatRole(role?: string) {
  switch (role) {
    case "ADMIN":
      return "Administrador";
    case "FINANCEIRO":
      return "Financeiro";
    case "SECRETARIA":
      return "Secretaria";
    case "PROFESSOR":
      return "Professor";
    default:
      return "Usuário";
  }
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [invite, setInvite] = useState<InviteResponse["invite"]>(undefined);

  const [schoolName, setSchoolName] = useState("");
  const [nome, setNome] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function loadInvite() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/auth/invites/${token}`, {
          cache: "no-store",
        });

        const result: InviteResponse = await response.json();

        if (!response.ok || !result.invite) {
          throw new Error(result.error || "Convite inválido ou expirado.");
        }

        setInvite(result.invite);
        setSchoolName(result.invite.schoolName || "EduGestão");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Convite inválido ou expirado."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvite();
  }, [token]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      const response = await fetch(`/api/auth/invites/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolName,
          nome,
          username,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível ativar a conta.");
      }

      router.push("/login");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível ativar a conta."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
        <div className="w-full max-w-md rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
          <p className="text-sm text-black/55">Carregando convite...</p>
        </div>
      </main>
    );
  }

  if (error && !invite) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
        <div className="w-full max-w-md rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
          <h1 className="text-2xl font-semibold text-black">
            Convite inválido
          </h1>
          <p className="mt-3 text-sm text-black/55">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
      <div className="w-full max-w-md rounded-[32px] border border-black/5 bg-white p-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)]">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-black">
            Ativar conta
          </h1>
          <p className="mt-2 text-sm text-black/55">
            Configure o acesso ao sistema.
          </p>
          <p className="mt-3 text-sm text-black/65">
            Convite para <strong>{invite?.email}</strong> •{" "}
            {formatRole(invite?.role)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">
              Nome da escola
            </label>
            <Input
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              placeholder="Nome da escola"
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">Seu nome</label>
            <Input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">
              Nome de usuário
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario"
              className="h-11 rounded-2xl"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium text-black">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Crie uma senha"
              className="h-11 rounded-2xl"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={submitting}
            className="mt-2 h-11 rounded-2xl bg-black text-white hover:bg-black/90"
          >
            {submitting ? "Ativando..." : "Ativar conta"}
          </Button>
        </form>
      </div>
    </main>
  );
}