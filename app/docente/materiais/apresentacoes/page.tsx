import { Suspense } from "react";
import { DocenteMaterialVaultPage } from "@/components/docente/docente-material-vault-page";

export default function DocenteMateriaisApresentacoesPage() {
  return (
    <Suspense fallback={null}>
      <DocenteMaterialVaultPage fixedTipo="SLIDE" />
    </Suspense>
  );
}
