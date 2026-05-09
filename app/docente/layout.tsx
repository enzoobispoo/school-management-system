import type { Metadata } from "next";
import { DocentePortalGate } from "@/components/docente/docente-portal-gate";

export const metadata: Metadata = {
  title: "Painel do professor",
};

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DocentePortalGate>{children}</DocentePortalGate>;
}
