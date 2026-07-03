import { useLocation } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { CommandNavigation } from "./command-navigation";

type AppTopbarProps = {
  groups: NavigationGroup[];
  userName: string;
  onLogout: () => void;
};

function isActivePath(currentPath: string, destination: string): boolean {
  return destination === "/"
    ? currentPath === "/"
    : currentPath === destination ||
        currentPath.startsWith(`${destination}/`);
}

function getInitials(userName: string): string {
  return userName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function AppTopbar({
  groups,
  userName,
  onLogout,
}: AppTopbarProps) {
  const { t } = useTranslation();
  const currentPath = useLocation({ select: (location) => location.pathname });
  const currentGroup = groups.find((group) =>
    group.items.some((item) => isActivePath(currentPath, item.to)),
  );
  const currentItem = currentGroup?.items
    .filter((item) => isActivePath(currentPath, item.to))
    .sort((left, right) => right.to.length - left.to.length)[0];
  return (
    <header className="sticky top-0 z-30 flex h-(--topbar-height) shrink-0 items-center gap-2 border-b bg-background/95 px-3 shadow-xs backdrop-blur supports-backdrop-filter:bg-background/80 md:px-4">
      <SidebarTrigger aria-label={t("nav.openMenu")} className="md:hidden" />
      <Separator orientation="vertical" className="mx-1 h-5 md:hidden" />

      <div className="hidden min-w-0 md:block">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {currentGroup ? <span>{t(currentGroup.labelKey)}</span> : null}
          {currentGroup && currentItem ? <span aria-hidden="true">/</span> : null}
          <span className="truncate font-medium text-foreground">
            {currentItem ? t(currentItem.labelKey) : t("common.appName")}
          </span>
        </div>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-1.5">
        <CommandNavigation groups={groups} />
        <ThemeToggle />
        <LanguageToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("account.menu")}
              className="rounded-full"
            >
              <Avatar size="sm">
                <AvatarFallback>{getInitials(userName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            <DropdownMenuLabel className="flex items-center gap-2 py-2">
              <UserRound aria-hidden="true" />
              <span className="truncate">{userName}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onLogout}>
              <LogOut aria-hidden="true" />
              {t("common.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
