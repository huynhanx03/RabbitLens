import { z } from "zod";

const normalizedExtensionSchema = z.object({ javascript_src: z.string() });

const rabbitExtensionSchema = z.object({
  javascript: z.union([z.string(), z.array(z.string())]),
});

const emptyExtensionSchema = z.tuple([]);

export const extensionSchema = z
  .union([
    normalizedExtensionSchema,
    rabbitExtensionSchema,
    emptyExtensionSchema,
  ])
  .transform((extension) => {
    if (Array.isArray(extension)) {
      return { javascript_src: "" };
    }

    if ("javascript_src" in extension) {
      return { javascript_src: extension.javascript_src };
    }

    return {
      javascript_src: Array.isArray(extension.javascript)
        ? extension.javascript.join(",")
        : extension.javascript,
    };
  });

export type ExtensionResponse = z.infer<typeof extensionSchema>;
