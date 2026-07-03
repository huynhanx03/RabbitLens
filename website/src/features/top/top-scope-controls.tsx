import type { NodeResponse } from "@/api/nodes-schema";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "react-i18next";

const ROW_COUNTS = [20, 50, 100, 150] as const;

type Props = {
  nodes: NodeResponse[];
  node: string;
  rowCount: number;
  onNodeChange: (node: string) => void;
  onRowCountChange: (rowCount: number) => void;
};

export function TopScopeControls({
  nodes,
  node,
  rowCount,
  onNodeChange,
  onRowCountChange,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Label>{t("top.node")}</Label>
        <Select value={node} onValueChange={onNodeChange}>
          <SelectTrigger aria-label={t("top.node")} className="min-w-52">
            <SelectValue placeholder={t("top.selectNode")} />
          </SelectTrigger>
          <SelectContent>
            {nodes.map((item) => (
              <SelectItem key={item.name} value={item.name}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Label>{t("top.rowCount")}</Label>
        <Select
          value={String(rowCount)}
          onValueChange={(value) => onRowCountChange(Number(value))}
        >
          <SelectTrigger aria-label={t("top.rowCount")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROW_COUNTS.map((count) => (
              <SelectItem key={count} value={String(count)}>
                {count}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
