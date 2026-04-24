"use client";

import { RecentActivity } from "@/components/dashboard/recent-activity";

interface DashboardActivitySectionProps {
  recentActivities: Array<{
    id: string;
    type: "enrollment" | "payment" | "new_student";
    name: string;
    description: string;
    time: string;
    initials: string;
  }>;
  loading: boolean;
}

export function DashboardActivitySection({
  recentActivities,
  loading,
}: DashboardActivitySectionProps) {
  return (
    <div className="mt-6">
      <RecentActivity activities={recentActivities} loading={loading} />
    </div>
  );
}