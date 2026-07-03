import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidRegex } from "@/api/query-string";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, X } from "lucide-react";

export type FilterBarProps = {
  /** Current filter name value from route search */
  name: string;
  /** Current regex toggle from route search */
  useRegex: boolean;
  /** Called with validated filter values to write to router search */
  onSubmit: (name: string, useRegex: boolean) => void;
};

export function FilterBar({ name, useRegex, onSubmit }: FilterBarProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(name);
  const [draftRegex, setDraftRegex] = useState(useRegex);
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(name);
    setDraftRegex(useRegex);
    setRegexError(null);
  }, [name, useRegex]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (draftRegex && draft && !isValidRegex(draft)) {
      setRegexError(t("filters.invalidRegex"));
      return;
    }
    setRegexError(null);
    onSubmit(draft.trim(), draftRegex);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center"
      role="search"
      aria-label={t("filters.searchLabel")}
    >
      <div className="relative w-full max-w-sm">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="text"
          aria-label={t("filters.nameLabel")}
          placeholder={t("filters.nameFilter")}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setRegexError(null);
          }}
          className="pl-8 pr-8"
          aria-invalid={!!regexError}
          aria-describedby={regexError ? "filter-regex-error" : undefined}
        />
        {draft ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-1/2 size-7 -translate-y-1/2"
            aria-label={t("filters.clear")}
            onClick={() => {
              setDraft("");
              setRegexError(null);
              onSubmit("", false);
            }}
          >
            <X aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <label className="flex items-center gap-1.5 text-sm whitespace-nowrap cursor-pointer select-none">
        <Checkbox
          checked={draftRegex}
          onCheckedChange={(checked) => {
            setDraftRegex(checked === true);
            setRegexError(null);
          }}
        />
        {t("filters.regex")}
      </label>
      <Button type="submit" variant="secondary" size="sm">
        {t("filters.apply")}
      </Button>
      {regexError && (
        <span id="filter-regex-error" className="text-sm text-destructive" role="alert">
          {regexError}
        </span>
      )}
    </form>
  );
}
