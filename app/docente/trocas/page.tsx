import { Suspense } from "react";
import { DocenteTrocasPage } from "@/components/docente/docente-trocas-page";

export default function DocenteTrocasRoutePage() {
  return (
    <Suspense fallback={null}>
      <DocenteTrocasPage />
    </Suspense>
  );
}
