export type OAuthFailureKind =
  | "initiation"
  | "login"
  | "logout"
  | "restore"
  | "renewal"
  | "silent-callback";

const diagnosticMessages: Record<OAuthFailureKind, string> = {
  initiation: "OAuth initiation failed",
  login: "OAuth login failed",
  logout: "OAuth logout failed",
  restore: "OAuth restore failed",
  renewal: "OAuth renewal failed",
  "silent-callback": "OAuth silent callback failed",
};

export function getOAuthFailureTranslationKey(
  kind: "login" | "logout",
): "auth.oauth.loginFailedDescription" | "auth.oauth.logoutFailedDescription" {
  return kind === "login"
    ? "auth.oauth.loginFailedDescription"
    : "auth.oauth.logoutFailedDescription";
}

export function reportOAuthFailure(
  kind: OAuthFailureKind,
  _providerError: unknown,
  logger: (message: string) => void = console.warn,
): void {
  logger(diagnosticMessages[kind]);
}
