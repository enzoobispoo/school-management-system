import type { Metadata } from "next";
export const metadata: Metadata = { title: "Cursos" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
