import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { AppBrand } from "./app-brand";

type AppSidebarProps = {
  groups: NavigationGroup[];
  currentPath: string;
};

function isActivePath(currentPath: string, destination: string): boolean {
  return destination === "/"
    ? currentPath === "/"
    : currentPath === destination || currentPath.startsWith(`${destination}/`);
}

export function AppSidebar({ groups, currentPath }: AppSidebarProps) {
  const { t } = useTranslation();
  const { isMobile, setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas" className="rl-sidebar">
      <nav
        aria-label={t("accessibility.primaryNavigation")}
        className="flex min-h-0 flex-1 flex-col"
      >
        <SidebarHeader className="h-(--topbar-height) justify-center border-b border-sidebar-border px-3">
          <Link
            to="/"
            className="rounded-xl outline-none transition-transform duration-200 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-sidebar-ring"
            aria-label={t("common.appName")}
          >
            <AppBrand />
          </Link>
        </SidebarHeader>

        <SidebarContent className="gap-3 px-2 py-3">
          {groups.map((group) => (
            <SidebarGroup key={group.id} className="p-0">
              <SidebarGroupLabel className="px-2 text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t(group.labelKey)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1.5">
                  {group.items.map((item) => {
                    const label = t(item.labelKey);
                    const childStates =
                      item.children?.map((child) => ({
                        child,
                        active: isActivePath(currentPath, child.to),
                      })) ?? [];
                    const active = item.children?.length
                      ? false
                      : isActivePath(currentPath, item.to);
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={active}
                          tooltip={label}
                          className="rl-sidebar-item h-9 rounded-xl px-2.5 font-medium"
                        >
                          <Link
                            to={item.to as never}
                            aria-current={active ? "page" : undefined}
                            onClick={() => {
                              if (isMobile) setOpenMobile(false);
                            }}
                          >
                            <Icon aria-hidden="true" />
                            <span>{label}</span>
                          </Link>
                        </SidebarMenuButton>
                        {item.children?.length ? (
                          <SidebarMenuSub className="my-1 gap-1.5">
                            {childStates.map(({ child, active: childActive }) => {
                              const childLabel = t(child.labelKey);
                              return (
                                <SidebarMenuSubItem key={child.id}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={childActive}
                                  >
                                    <Link
                                      to={child.to as never}
                                      aria-current={
                                        childActive ? "page" : undefined
                                      }
                                      onClick={() => {
                                        if (isMobile) setOpenMobile(false);
                                      }}
                                    >
                                      <span>{childLabel}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        ) : null}
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>
      </nav>
    </Sidebar>
  );
}
