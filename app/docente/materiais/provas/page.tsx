import { Suspense } from "react";
import { DocenteMaterialVaultPage } from "@/components/docente/docente-material-vault-page";

export default function DocenteMateriaisProvasPage() {
  return (
    <Suspense fallback={null}>
      <DocenteMaterialVaultPage fixedTipo="PROVA_IMPRESSAO" />
    </Suspense>
  );
}
