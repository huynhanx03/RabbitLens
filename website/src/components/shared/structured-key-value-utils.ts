import type { ReactNode } from "react";
import type { StructuredKeyValueEntry } from "./structured-key-value";

export function objectToStructuredEntries(
  value: unknown,
): StructuredKeyValueEntry[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).map(([key, entryValue]) => ({
    key,
    value: formatStructuredValue(entryValue),
    monospace: true,
  }));
}

function formatStructuredValue(value: unknown): ReactNode {
  if (value === null || value === undefined) {
    return "null";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (!value.length) {
      return "[]";
    }

    return value
      .map((item) =>
        typeof item === "object" ? JSON.stringify(item) : String(item),
      )
      .join(", ");
  }

  return JSON.stringify(value);
}
