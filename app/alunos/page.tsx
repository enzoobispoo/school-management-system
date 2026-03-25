import { Suspense } from "react";
import { StudentsPageClient } from "@/components/alunos/students-page-client";

export default function AlunosPage() {
  return (
    <Suspense fallback={null}>
      <StudentsPageClient />
    </Suspense>
  );
}