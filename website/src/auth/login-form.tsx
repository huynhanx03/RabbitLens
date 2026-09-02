import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useAuth } from "./auth-context";
import { getWhoAmI } from "./whoami-api";
import { createBasicAuthorization } from "./basic-auth";
import { ManagementApiClient } from "@/api/management-api-client";
import { ApiError } from "@/api/api-error";
import { useRuntimeConfig } from "@/config/runtime-config-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { Eye, EyeOff } from "lucide-react";
import { AppBrand } from "@/app/layout/app-brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { PRODUCT_DEFAULTS } from "@/config/defaults";

const loginSchema = z.object({
  username: z.string().trim().min(1, "usernameRequired"),
  password: z.string().min(1, "passwordRequired"),
});

type LoginValues = z.infer<typeof loginSchema>;

import { OAuthResourcePicker } from "./oauth/oauth-resource-picker";

export function LoginForm() {
  const { t } = useTranslation();
  const auth = useAuth();
  const config = useRuntimeConfig();
  const navigate = useNavigate();
  // We'll type this properly when the route is defined, for now use generic search
  const search = useSearch({ strict: false }) as { redirect?: string };
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = async (values: LoginValues) => {
    setErrorText(null);
    const isLocalhost = ["localhost", "127.0.0.1", "[::1]"].includes(window.location.hostname);
    if (window.location.protocol !== "https:" && !isLocalhost) {
      setErrorText(t("auth.secureOriginRequired"));
      return;
    }

    try {
      const authorization = createBasicAuthorization(values.username, values.password);
      const client = new ManagementApiClient({
        baseUrl: config.apiBaseUrl,
        getSession: () => ({ type: "basic", authorization }),
        timeoutMs: PRODUCT_DEFAULTS.requests.timeoutMs,
        fetcher: fetch,
        onUnauthorized: () => auth.logout(),
      });

      const user = await getWhoAmI(client);
      auth.loginBasic(values.username, values.password);
      auth.setUser(user);
      setValue("password", "");

      const redirect = search.redirect ?? "/";
      const isValidRedirect = redirect.startsWith("/") && !redirect.startsWith("//");
      navigate({ to: isValidRedirect ? redirect : "/" });
    } catch (error) {
      auth.logout();
      setValue("password", "");
      if (error instanceof ApiError && error.kind === "unauthorized") {
        setErrorText(t("auth.invalidCredentials"));
      } else if (error instanceof ApiError) {
        setErrorText(t(`errors.${error.kind}` as const));
      } else {
        setErrorText(t("errors.unexpected"));
      }
    }
  };

  const showBasic = config.auth.basic;
  const showOAuth = !!config.auth.oauth;

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      <img
        src="/login-bg.png"
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-55"
      />
      <div className="pointer-events-none absolute inset-0 bg-background/80" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,hsl(var(--background)/0.35)_52%,hsl(var(--background)/0.88)_100%)]" />

      <div className="absolute right-4 top-4 z-20 flex items-center gap-1">
        <ThemeToggle />
        <LanguageToggle />
      </div>

      <section className="relative z-10 w-full max-w-md">
        <Card className="w-full rounded-3xl border-border/70 bg-card/92 shadow-2xl shadow-black/35 backdrop-blur-md animate-animated animate-fadeInUp">
          <CardHeader className="space-y-4 px-6 pb-2 pt-8 text-center sm:px-9 sm:pt-9">
            <div className="flex justify-center">
              <AppBrand />
            </div>
            <div className="space-y-1.5">
              <h1 className="text-2xl font-semibold tracking-tight">{t("auth.title")}</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("auth.description")}</p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 px-6 pb-8 pt-4 sm:px-9 sm:pb-9">
            {errorText ? (
              <Alert variant="destructive" tabIndex={-1} ref={(element) => element?.focus()}>
                <AlertTitle>{t("auth.signInFailed")}</AlertTitle>
                <AlertDescription>{errorText}</AlertDescription>
              </Alert>
            ) : null}

            {showOAuth ? <OAuthResourcePicker /> : null}

            {showBasic && showOAuth ? (
              <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                {t("common.or")}
                <span className="h-px flex-1 bg-border" />
              </div>
            ) : null}

            {showBasic ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="username">{t("auth.username")}</Label>
                  <Input
                    id="username"
                    autoComplete="username"
                    {...register("username")}
                    disabled={isSubmitting}
                    placeholder="admin"
                    aria-invalid={Boolean(errors.username)}
                  />
                  {errors.username ? (
                    <p className="text-sm text-destructive" role="alert">
                      {t(`auth.${errors.username.message}`)}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...register("password")}
                      disabled={isSubmitting}
                      className="pr-10"
                      placeholder="••••••••"
                      aria-invalid={Boolean(errors.password)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
                      onClick={() => setShowPassword((visible) => !visible)}
                    >
                      {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
                    </Button>
                  </div>
                  {errors.password ? (
                    <p className="text-sm text-destructive" role="alert">
                      {t(`auth.${errors.password.message}`)}
                    </p>
                  ) : null}
                </div>
                <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                  {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
