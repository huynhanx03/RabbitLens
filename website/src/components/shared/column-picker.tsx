import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

export type ColumnPickerProps = {
  /** All available columns: { id, label } */
  columns: { id: string; label: string }[];
  /** Currently visible column IDs */
  visible: string[];
  /** Called when visibility changes */
  onChange: (visible: string[]) => void;
};

export function ColumnPicker({
  columns,
  visible,
  onChange,
}: ColumnPickerProps) {
  const { t } = useTranslation();

  const toggleColumn = (id: string) => {
    if (visible.includes(id)) {
      // Prevent hiding the last column
      if (visible.length <= 1) return;
      onChange(visible.filter((v) => v !== id));
    } else {
      onChange([...visible, id]);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          aria-label={t("columns.toggle")}
        >
          <Settings2 className="size-4" />
          {t("columns.label")}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-48 p-2">
        <div className="flex flex-col gap-1">
          {columns.map((col) => (
            <label
              key={col.id}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-sm cursor-pointer hover:bg-muted"
            >
              <Checkbox
                checked={visible.includes(col.id)}
                onCheckedChange={() => toggleColumn(col.id)}
              />
              {col.label}
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
