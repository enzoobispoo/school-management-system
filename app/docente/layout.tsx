import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Painel do professor",
};

export default function DocenteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
