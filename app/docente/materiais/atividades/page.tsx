import { Suspense } from "react";
import { DocenteMaterialVaultPage } from "@/components/docente/docente-material-vault-page";

export default function DocenteMateriaisAtividadesPage() {
  return (
    <Suspense fallback={null}>
      <DocenteMaterialVaultPage fixedTipo="ATIVIDADE_IMPRESSAO" />
    </Suspense>
  );
}
