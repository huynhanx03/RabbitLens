import { type PropsWithChildren, useId } from "react";

type SectionCardProps = PropsWithChildren<{
  title: string;
  /** Optional description below the title */
  description?: string;
  /** Optional action slot on the right side of the header */
  action?: React.ReactNode;
}>;

/**
 * A collapsible section panel used in detail pages.
 */
export function SectionCard({
  title,
  description,
  action,
  children,
}: SectionCardProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className="rl-panel rl-section-panel overflow-hidden text-card-foreground"
    >
      <div className="rl-section-header flex flex-col justify-between gap-4 border-b px-4 py-3 sm:flex-row sm:items-center">
        <div>
          <h2 id={headingId} className="text-sm font-semibold leading-none">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
