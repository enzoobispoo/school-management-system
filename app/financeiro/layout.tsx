import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { FinanceiroLayoutPluggyStrip } from "@/components/financeiro/financeiro-layout-pluggy-strip";

export default function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      <FinanceiroLayoutPluggyStrip />
      {children}
    </DashboardLayout>
  );
}
