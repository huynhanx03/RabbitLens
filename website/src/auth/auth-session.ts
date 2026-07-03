export type AuthSession =
  | { readonly type: "anonymous" }
  | { readonly type: "basic"; readonly authorization: string }
  | { readonly type: "bearer"; readonly accessToken: string }
  | { readonly type: "restoring_oauth" }
  | { readonly type: "expiring"; readonly accessToken: string }
  | { readonly type: "expired" };

export type AuthenticatedUser = {
  readonly name: string;
  readonly tags: readonly string[];
  readonly loginSessionTimeoutMinutes?: number;
};

export type AuthState = {
  readonly session: AuthSession;
  readonly user: AuthenticatedUser | null;
};
