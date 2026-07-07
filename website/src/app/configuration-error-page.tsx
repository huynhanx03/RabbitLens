import { ArrowRight, CircleAlert, RefreshCw, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function ConfigurationErrorPage() {
  const { t } = useTranslation();
  const currentPath = `${window.location.pathname}${window.location.search}`;
  const loginHref =
    window.location.pathname === "/login" || currentPath === "/"
      ? "/login"
      : `/login?redirect=${encodeURIComponent(currentPath)}`;

  return (
    <main className="relative grid min-h-svh place-items-center overflow-hidden bg-background p-6 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,hsl(var(--primary)/0.18),transparent_32rem),radial-gradient(circle_at_80%_80%,hsl(var(--destructive)/0.12),transparent_28rem)]"
      />
      <section
        aria-labelledby="configuration-error-title"
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-border/70 bg-card/90 p-6 shadow-2xl shadow-primary/5 backdrop-blur sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 text-destructive">
              <CircleAlert className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                RabbitLens
              </p>
              <h1
                id="configuration-error-title"
                className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl"
              >
                {t("errors.configurationTitle")}
              </h1>
            </div>
          </div>
          <div className="hidden rounded-2xl border border-primary/20 bg-primary/10 p-3 text-primary sm:block">
            <Settings2 className="h-5 w-5" aria-hidden="true" />
          </div>
        </div>

        <p className="text-base leading-7 text-muted-foreground">
          {t("errors.configurationDescription")}
        </p>

        <div className="mt-6 rounded-2xl border border-border/60 bg-background/60 p-4">
          <div className="flex gap-3 text-sm text-muted-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
            <p>{t("errors.configurationHint")}</p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            size="lg"
            onClick={() => window.location.reload()}
            className="h-11"
          >
            <RefreshCw aria-hidden="true" />
            {t("errors.reloadPage")}
          </Button>
          <Button asChild variant="outline" size="lg" className="h-11">
            <a href={loginHref}>
              {t("errors.backToLogin")}
              <ArrowRight aria-hidden="true" />
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
