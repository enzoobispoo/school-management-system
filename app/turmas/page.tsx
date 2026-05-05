import { Suspense } from "react";
import { TurmasPageClient } from "@/components/turmas/turmas-page-client";

export const metadata = { title: "Turmas" };

export default function TurmasPage() {
  return (
    <Suspense fallback={null}>
      <TurmasPageClient />
    </Suspense>
  );
}