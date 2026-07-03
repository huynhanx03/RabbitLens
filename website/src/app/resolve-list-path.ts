const EXTENSIONS_WITH_STATUS_ROUTE = new Set([
  "federation",
  "shovels",
  "streams",
]);

export function resolveListPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "admin" && parts[1]) return `/admin/${parts[1]}`;
  if (parts[0] === "extensions" && parts[1]) {
    const suffix = EXTENSIONS_WITH_STATUS_ROUTE.has(parts[1]) ? "/status" : "";
    return `/extensions/${parts[1]}${suffix}`;
  }
  return parts[0] ? `/${parts[0]}` : "/";
}
