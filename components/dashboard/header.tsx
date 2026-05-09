"use client";

import { Search } from "lucide-react";
import { HeaderCalendarPopover } from "@/components/calendario/header-calendar-popover";
import { HeaderNotifications } from "@/components/dashboard/header/header-notifications";
import { HeaderProfileMenu } from "@/components/dashboard/header/header-profile-menu";
import { HeaderSearch } from "@/components/dashboard/header/header-search";
import { HeaderLanguageSwitcher } from "@/components/dashboard/header/header-language-switcher";
import { HeaderThemeToggle } from "@/components/dashboard/header/header-theme-toggle";
import { HeaderTitleBlock } from "@/components/dashboard/header/header-title-block";
import { GlobalSearch } from "@/components/dashboard/global-search";
import { KeyboardShortcutsModal } from "@/components/dashboard/keyboard-shortcuts-modal";
import { useDashboardLanguage } from "@/lib/i18n/dashboard-language";

interface HeaderProps {
  title?: string;
  description?: string;
  /** Quando definido, substitui `title` via i18n do dashboard. */
  titleKey?: string;
  descriptionKey?: string;
}

export function Header({
  title,
  description,
  titleKey,
  descriptionKey,
}: HeaderProps) {
  const { t } = useDashboardLanguage();
  const resolvedTitle =
    titleKey ? t(titleKey) : title ?? "";
  const resolvedDescription =
    descriptionKey ? t(descriptionKey) : description;

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 px-6 py-3 backdrop-blur-xl transition-all duration-200">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 pl-12 lg:pl-0">
            <HeaderTitleBlock
              title={resolvedTitle}
              description={resolvedDescription}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "k",
                    metaKey: true,
                    bubbles: true,
                  })
                );
              }}
              className="hidden sm:flex h-9 items-center gap-2 rounded-xl border border-border/50 bg-muted/40 px-3 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{t("header.searchPlaceholder")}</span>
              <kbd className="hidden lg:inline-flex h-5 items-center gap-1 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <HeaderSearch />
            <HeaderCalendarPopover />
            <HeaderLanguageSwitcher />
            <HeaderThemeToggle />
            <HeaderNotifications />
            <HeaderProfileMenu />
          </div>
        </div>
      </header>
      <GlobalSearch />
      <KeyboardShortcutsModal />
    </>
  );
}
