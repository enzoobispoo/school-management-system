import { Suspense } from "react";
import { TurmasPageClient } from "@/components/turmas/turmas-page-client";

export default function TurmasPage() {
  return (
    <Suspense fallback={null}>
      <TurmasPageClient />
    </Suspense>
  );
}