"use client";

import Link from "next/link";
import { ArrowLeft, FileStack, Images, ListChecks, Presentation } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Header } from "@/components/dashboard/header";
import { DashboardMainLayout } from "@/components/dashboard/dashboard-main-layout";
import { DocenteMateriaisTabs } from "@/components/docente/docente-materiais-tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function DocenteMateriaisPage() {
  return (
    <DashboardLayout>
      <Header
        title="Materiais do professor"
        description="Ambientes separados para guardar o que você produz — apresentações, provas e atividades em arquivo."
      />

      <DashboardMainLayout rightPanel={null}>
        <div className="space-y-6 pt-2">
          <DocenteMateriaisTabs />

          <Button variant="ghost" size="sm" className="rounded-xl" asChild>
            <Link href="/docente">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao painel
            </Link>
          </Button>

          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Cada ambiente é só seu arquivo organizado: envie PDFs e documentos que você já
            criou e abra quando precisar. As turmas continuam com chamadas, notas e provas
            lançadas pelo sistema nas páginas da turma.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Presentation className="h-4 w-4 text-primary" />
                  Apresentações
                </CardTitle>
                <CardDescription className="text-xs">
                  Slides e PDFs de aula que você elabora fora daqui.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" size="sm" className="w-full rounded-xl" asChild>
                  <Link href="/docente/materiais/apresentacoes">Abrir ambiente</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FileStack className="h-4 w-4 text-primary" />
                  Provas (arquivo)
                </CardTitle>
                <CardDescription className="text-xs">
                  Versões para impressão das suas provas; além disso você pode criar avaliações pela turma.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" size="sm" className="w-full rounded-xl" asChild>
                  <Link href="/docente/materiais/provas">Abrir ambiente</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/60 shadow-sm transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Atividades (arquivo)
                </CardTitle>
                <CardDescription className="text-xs">
                  Listas e atividades extras em PDF ou documento.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="secondary" size="sm" className="w-full rounded-xl" asChild>
                  <Link href="/docente/materiais/atividades">Abrir ambiente</Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-dashed border-border/70 bg-muted/20 shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Images className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-medium">Dica</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground">
              Use a turma opcional no envio para agrupar materiais por classe; deixe em branco
              para materiais gerais que você reutiliza em várias turmas.
            </CardContent>
          </Card>
        </div>
      </DashboardMainLayout>
    </DashboardLayout>
  );
}
