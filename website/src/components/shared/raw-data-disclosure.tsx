import type { ReactNode } from "react";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type RawDataDisclosureProps = {
  title?: ReactNode;
  value: unknown;
  className?: string;
};

export function RawDataDisclosure({
  title = "Raw data",
  value,
  className,
}: RawDataDisclosureProps) {
  const [open, setOpen] = useState(false);

  return (
    <details
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={cn(
        "group rounded-xl border border-border/60 bg-background/30 px-3 py-2 text-sm",
        className,
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 text-muted-foreground transition-colors hover:text-foreground">
        <ChevronRight
          aria-hidden="true"
          className="size-4 transition-transform group-open:rotate-90"
        />
        <span className="font-medium">{title}</span>
      </summary>
      {open ? (
        <pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted/70 p-3 font-mono text-xs leading-relaxed text-muted-foreground">
          {JSON.stringify(value, null, 2)}
        </pre>
      ) : null}
    </details>
  );
}
