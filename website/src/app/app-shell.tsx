import { useQuery } from "@tanstack/react-query";
import { Outlet, useLocation, useRouteContext } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AppSidebar } from "@/app/layout/app-sidebar";
import { AppTopbar } from "@/app/layout/app-topbar";
import { buildNavigation } from "@/app/navigation/navigation-registry";
import { AppStatusAnnouncer } from "@/components/shared/app-status-announcer";
import { ConnectivityBanner } from "@/components/shared/connectivity-banner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { extensionsQueryOptions } from "@/domains/extensions/extension-query";

export function AppShell() {
  const { t } = useTranslation();
  const context = useRouteContext({ from: "__root__" });
  const currentPath = useLocation({ select: (location) => location.pathname });
  const extensionsQuery = useQuery(extensionsQueryOptions(context.apiClient));

  if (extensionsQuery.isPending) {
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  }

  if (extensionsQuery.isError) {
    return (
      <div className="p-8 text-center text-destructive">
        {t("errors.unexpected")}
      </div>
    );
  }

  const userTags = context.auth.user?.tags ?? [];
  const groups = buildNavigation({
    userTags,
    extensions: extensionsQuery.data,
  });
  const currentItem = groups
    .flatMap((group) => group.items)
    .filter((item) =>
      item.to === "/"
        ? currentPath === "/"
        : currentPath === item.to || currentPath.startsWith(`${item.to}/`),
    )
    .sort((left, right) => right.to.length - left.to.length)[0];
  return (
    <>
      <a
        href="#main-content"
        className="sr-only fixed left-3 top-3 z-50 rounded-lg bg-background px-3 py-2 shadow-md focus:not-sr-only"
      >
        {t("accessibility.skipToMain")}
      </a>
      <SidebarProvider open>
        <AppSidebar groups={groups} currentPath={currentPath} />
        <SidebarInset
          id="main-content"
          className="rl-app-shell min-w-0 bg-background"
        >
          <AppTopbar
            groups={groups}
            userName={context.auth.user?.name ?? ""}
            onLogout={() => context.auth.logout()}
          />
          <ConnectivityBanner />
          <div className="min-w-0 flex-1 px-(--page-gutter) py-5 md:py-6">
            <h1 className="sr-only">
              {currentItem ? t(currentItem.labelKey) : t("common.appName")}
            </h1>
            <Outlet />
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AppStatusAnnouncer />
    </>
  );
}
