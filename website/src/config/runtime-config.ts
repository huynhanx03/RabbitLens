import {
  runtimeConfigSchema,
  type RuntimeConfig,
} from "./runtime-config-schema";

export const RUNTIME_CONFIG_FILE_NAME = "runtime-config.json";

export async function loadRuntimeConfig(
  fetcher: typeof fetch = fetch,
): Promise<RuntimeConfig> {
  const url = new URL(RUNTIME_CONFIG_FILE_NAME, document.baseURI);
  const response = await fetcher(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Runtime configuration request failed: ${response.status}`);
  }

  return runtimeConfigSchema.parse(await response.json());
}
