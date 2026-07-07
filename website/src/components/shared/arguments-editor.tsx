import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export type ArgumentValue = string | number | boolean;

export interface ArgumentsEditorProps {
  value: Record<string, ArgumentValue>;
  onChange: (value: Record<string, ArgumentValue>) => void;
  disabled?: boolean;
}

export function ArgumentsEditor({
  value,
  onChange,
  disabled,
}: ArgumentsEditorProps) {
  const { t } = useTranslation();
  const entries = Object.entries(value);
  const [newKey, setNewKey] = useState("");
  const [newValueType, setNewValueType] = useState<"string" | "number" | "boolean">("string");
  const [newValue, setNewValue] = useState("");

  const handleAdd = () => {
    if (!newKey) return;
    
    let parsedValue: ArgumentValue = newValue;
    if (newValueType === "number") {
      parsedValue = Number(newValue);
      if (isNaN(parsedValue)) return;
    } else if (newValueType === "boolean") {
      parsedValue = newValue === "true";
    }

    onChange({ ...value, [newKey]: parsedValue });
    setNewKey("");
    setNewValue("");
  };

  const handleRemove = (key: string) => {
    const next = { ...value };
    delete next[key];
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-background/35 p-4">
      <div className="rounded-xl border border-border/50 bg-background/30 p-4">
        <div className="grid gap-3 md:grid-cols-[minmax(10rem,1fr)_12rem_minmax(10rem,1fr)_auto] md:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("common.key")}
            </Label>
            <Input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              disabled={disabled}
              placeholder="x-message-ttl"
              className="h-11"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("common.type")}
            </Label>
            <Select
              value={newValueType}
              onValueChange={(v: "string" | "number" | "boolean") => setNewValueType(v)}
              disabled={disabled}
            >
              <SelectTrigger className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">{t("common.type")} String</SelectItem>
                <SelectItem value="number">{t("common.type")} Number</SelectItem>
                <SelectItem value="boolean">{t("common.type")} Boolean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("common.value")}
            </Label>
            {newValueType === "boolean" ? (
              <Select
                value={newValue}
                onValueChange={setNewValue}
                disabled={disabled}
              >
                <SelectTrigger className="h-11 w-full">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">true</SelectItem>
                  <SelectItem value="false">false</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                disabled={disabled}
                type={newValueType === "number" ? "number" : "text"}
                className="h-11"
              />
            )}
          </div>

          <Button
            type="button"
            variant="secondary"
            disabled={disabled || !newKey}
            onClick={handleAdd}
            className="h-11 rounded-full px-6"
          >
            <Plus className="mr-1 h-4 w-4" />
            {t("common.add")}
          </Button>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="space-y-2 rounded-xl border border-border/60 bg-card/50 p-3">
          {entries.map(([k, v]) => (
            <div
              key={k}
              className="grid gap-2 rounded-lg bg-background/50 p-2 text-sm sm:grid-cols-[minmax(8rem,1fr)_7rem_minmax(8rem,1fr)_auto] sm:items-center"
            >
              <span className="min-w-0 break-words rounded bg-muted px-2 py-1 font-mono">
                {k}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {typeof v}
              </span>
              <span className="min-w-0 break-words">{String(v)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={disabled}
                onClick={() => handleRemove(k)}
                aria-label={t("common.delete")}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
