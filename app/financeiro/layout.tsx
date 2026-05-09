import { DashboardLayout } from "@/components/dashboard/dashboard-layout";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
