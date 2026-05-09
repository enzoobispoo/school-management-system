"use client";

import { Header } from "@/components/dashboard/header";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

type ResourcePageHeaderProps =
  | { title: string; variant: "student" | "teacher" | "course" }
  | { title: string; variant: "class"; courseName: string };

/** Header com descrição traduzida para páginas de perfil carregadas no servidor. */
export function ResourcePageHeader(props: ResourcePageHeaderProps) {
  const { t } = useDashboardLanguage();
  const description =
    props.variant === "class" ?
      `${t("page.classDetail.prefix")} ${props.courseName}`
    : props.variant === "student" ?
      t("page.studentProfile.suffix")
    : props.variant === "teacher" ?
      t("page.teacherProfile.suffix")
    : t("page.courseDetail.suffix");

  return <Header title={props.title} description={description} />;
}
