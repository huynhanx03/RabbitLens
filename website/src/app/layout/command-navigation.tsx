import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { CornerDownRight, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NavigationGroup } from "@/app/navigation/navigation-types";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

type CommandNavigationProps = {
  groups: NavigationGroup[];
};

export function CommandNavigation({ groups }: CommandNavigationProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((current) => !current);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const selectDestination = (to: string) => {
    setOpen(false);
    void navigate({ to: to as never });
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 w-9 justify-center gap-2 border-border/80 bg-background text-muted-foreground shadow-none lg:w-56 lg:justify-start"
        aria-label={t("nav.command")}
        onClick={() => setOpen(true)}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="hidden truncate lg:inline">{t("nav.command")}</span>
        <kbd className="ml-auto hidden rounded border bg-muted px-1.5 py-0.5 font-sans text-[0.625rem] text-muted-foreground lg:inline">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={t("nav.command")}
        description={t("nav.commandPlaceholder")}
      >
        <Command>
          <CommandInput placeholder={t("nav.commandPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("nav.noCommandResults")}</CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.id} heading={t(group.labelKey)}>
                {group.items.map((item) => {
                  const label = t(item.labelKey);
                  const Icon = item.icon;

                  return [
                    <CommandItem
                      key={item.id}
                      value={[label, ...item.keywords].join(" ")}
                      onSelect={() => selectDestination(item.to)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      <CommandShortcut>↵</CommandShortcut>
                    </CommandItem>,
                    ...(item.children ?? []).map((child) => (
                      <CommandItem
                        key={child.id}
                        value={[t(child.labelKey), ...child.keywords].join(" ")}
                        onSelect={() => selectDestination(child.to)}
                        className="pl-8"
                      >
                        <CornerDownRight aria-hidden="true" />
                        <span>{t(child.labelKey)}</span>
                        <CommandShortcut>↵</CommandShortcut>
                      </CommandItem>
                    )),
                  ];
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
