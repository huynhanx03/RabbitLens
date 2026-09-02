import type { RuntimeConfig } from "./runtime-config-schema";

export const RUNTIME_CONFIG_FILE_NAME = "runtime-config.json";

export async function loadRuntimeConfig(fetcher: typeof fetch = fetch): Promise<RuntimeConfig> {
  const url = new URL(`/${RUNTIME_CONFIG_FILE_NAME}`, window.location.origin);
  // Runtime validation is mandatory, but its Zod graph does not need to ship in
  // the initial application chunk. Start both I/O operations together so this
  // code split adds no serial startup wait.
  const [response, { runtimeConfigSchema }] = await Promise.all([
    fetcher(url, { cache: "no-store" }),
    import("./runtime-config-schema"),
  ]);

  if (!response.ok) {
    throw new Error(`Runtime configuration request failed: ${response.status}`);
  }

  return runtimeConfigSchema.parse(await response.json());
}
