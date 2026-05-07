import { Suspense } from "react";
import { DocenteDashboardPage } from "@/components/docente/docente-dashboard-page";

export default function DocentePage() {
  return (
    <Suspense fallback={null}>
      <DocenteDashboardPage />
    </Suspense>
  );
}
