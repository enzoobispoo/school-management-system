import { Suspense } from "react";
import { DocenteMateriaisPage } from "@/components/docente/docente-materiais-page";

export default function DocenteMateriaisRoutePage() {
  return (
    <Suspense fallback={null}>
      <DocenteMateriaisPage />
    </Suspense>
  );
}
