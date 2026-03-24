"use client";

interface DashboardGreetingProps {
  name?: string;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export function DashboardGreeting({
  name = "Administrador",
}: DashboardGreetingProps) {
  return (
    <div className="rounded-[28px] border border-black/[0.04] bg-[#fafafa] px-6 py-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="text-sm text-black/40">Visão geral</p>

      <h2 className="mt-1 text-[34px] font-semibold tracking-[-0.04em] text-black">
        {getGreeting()}, {name}
      </h2>

      <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
        Aqui está um resumo do desempenho, financeiro e atividades recentes da escola.
      </p>
    </div>
  );
}