import { Suspense } from "react";
import { AcademicoPageClient } from "@/components/academico/academico-page-client";

export const metadata = { title: "Acadêmico" };

export default function AcademicoPage() {
  return (
    <Suspense fallback={null}>
      <AcademicoPageClient />
    </Suspense>
  );
}

