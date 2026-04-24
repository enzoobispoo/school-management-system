"use client";

import { HeaderCalendarPopover } from "@/components/calendario/header-calendar-popover";
import { HeaderNotifications } from "@/components/dashboard/header/header-notifications";
import { HeaderProfileMenu } from "@/components/dashboard/header/header-profile-menu";
import { HeaderSearch } from "@/components/dashboard/header/header-search";
import { HeaderTitleBlock } from "@/components/dashboard/header/header-title-block";

interface HeaderProps {
  title: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 px-6 py-4 backdrop-blur transition-all duration-200 supports-[backdrop-filter]:bg-background/75 data-[density=compact]:px-5 data-[density=compact]:py-3">
      <div className="flex items-center justify-between gap-4 data-[density=compact]:gap-3">
        <div className="min-w-0 pl-12 lg:pl-0">
          <HeaderTitleBlock title={title} description={description} />
        </div>

        <div className="flex shrink-0 items-center gap-3 data-[density=compact]:gap-2">
          <HeaderSearch />
          <HeaderCalendarPopover />
          <HeaderNotifications />
          <HeaderProfileMenu />
        </div>
      </div>
    </header>
  );
}