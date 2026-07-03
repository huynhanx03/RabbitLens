import { render, type RenderOptions } from "@testing-library/react";
import { type ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RuntimeConfigProvider } from "@/config/runtime-config-provider";
import { AuthProvider } from "@/auth/auth-provider";
import { ThemeProvider } from "@/app/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAuthStore } from "@/auth/auth-store";

const mockConfig = {
  apiBaseUrl: "http://localhost/api",
  auth: { basic: true, oauth: null },
  defaultLocale: "en" as const,
  defaultTheme: "system" as const,
};

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  const store = createAuthStore();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  
  return render(ui, {
    wrapper: ({ children }) => (
      <RuntimeConfigProvider config={mockConfig}>
        <AuthProvider store={store} onLogout={() => {}}>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider defaultPreference="system">
              <TooltipProvider>{children}</TooltipProvider>
            </ThemeProvider>
          </QueryClientProvider>
        </AuthProvider>
      </RuntimeConfigProvider>
    ),
    ...options,
  });
}
