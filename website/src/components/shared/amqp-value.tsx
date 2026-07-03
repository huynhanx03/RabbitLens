import { type ReactNode } from "react";

const MAX_NESTING_DEPTH = 6;

type AmqpValueProps = {
  value: unknown;
};

/**
 * Recursively renders AMQP values (strings, numbers, booleans, null,
 * arrays, nested tables, byte arrays, timestamps, and long values).
 * Uses a maximum nesting depth to prevent infinite recursion.
 */
export function AmqpValue({ value }: AmqpValueProps) {
  return <span className="font-mono text-sm">{renderValue(value, 0)}</span>;
}

function renderValue(value: unknown, depth: number): ReactNode {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground italic">null</span>;
  }

  if (typeof value === "boolean") {
    return <span className="text-blue-600 dark:text-blue-400">{String(value)}</span>;
  }

  if (typeof value === "number") {
    return <span className="tabular-nums">{value}</span>;
  }

  if (typeof value === "string") {
    return <>{escapeHtml(value)}</>;
  }

  if (Array.isArray(value)) {
    if (depth >= MAX_NESTING_DEPTH) {
      return <CollapsedJson value={value} />;
    }
    return (
      <span>
        [
        {value.map((item, i) => (
          <span key={i}>
            {i > 0 && ", "}
            {renderValue(item, depth + 1)}
          </span>
        ))}
        ]
      </span>
    );
  }

  if (typeof value === "object") {
    if (depth >= MAX_NESTING_DEPTH) {
      return <CollapsedJson value={value} />;
    }
    const entries = Object.entries(value);
    return (
      <span className="inline-flex flex-col gap-0.5 pl-2 border-l border-border">
        {entries.map(([key, val]) => (
          <span key={key}>
            <span className="text-muted-foreground">{escapeHtml(key)}: </span>
            {renderValue(val, depth + 1)}
          </span>
        ))}
      </span>
    );
  }

  return <>{String(value)}</>;
}

function CollapsedJson({ value }: { value: unknown }) {
  return (
    <details className="inline">
      <summary className="cursor-pointer text-muted-foreground text-xs">
        {typeof value === "object" && value !== null
          ? Array.isArray(value)
            ? `[${value.length} items]`
            : `{${Object.keys(value).length} keys}`
          : "..."}
      </summary>
      <pre className="text-xs mt-1 p-2 bg-muted rounded overflow-auto max-h-40">
        {JSON.stringify(value, null, 2)}
      </pre>
    </details>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
