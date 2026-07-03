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
    <div className="space-y-4">
      {Object.entries(value).length > 0 && (
        <div className="space-y-2 border rounded-md p-2">
          {Object.entries(value).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 text-sm">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded flex-1">
                {k}
              </span>
              <span className="text-muted-foreground w-16 text-xs uppercase">
                {typeof v}
              </span>
              <span className="flex-1 truncate">{String(v)}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                disabled={disabled}
                onClick={() => handleRemove(k)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{t("common.key")}</Label>
          <Input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            disabled={disabled}
            placeholder="x-message-ttl"
          />
        </div>
        <div className="w-28 space-y-1">
          <Label className="text-xs">{t("common.type")}</Label>
          <Select
            value={newValueType}
            onValueChange={(v: "string" | "number" | "boolean") => setNewValueType(v)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="string">{t("common.type")} String</SelectItem>
              <SelectItem value="number">{t("common.type")} Number</SelectItem>
              <SelectItem value="boolean">{t("common.type")} Boolean</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-1">
          <Label className="text-xs">{t("common.value")}</Label>
          {newValueType === "boolean" ? (
            <Select
              value={newValue}
              onValueChange={setNewValue}
              disabled={disabled}
            >
              <SelectTrigger>
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
            />
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || !newKey}
          onClick={handleAdd}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("common.add")}
        </Button>
      </div>
    </div>
  );
}
