import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-[80px] font-bold leading-none tracking-[-0.05em] text-foreground">404</p>
      <h1 className="mt-4 text-xl font-semibold text-foreground">Página não encontrada</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        O endereço que você acessou não existe ou foi removido.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-10 items-center rounded-2xl bg-foreground px-5 text-sm font-medium text-background transition hover:opacity-85"
      >
        Voltar ao início
      </Link>
    </div>
  );
}
