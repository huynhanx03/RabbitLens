import { ColumnPicker, type ColumnPickerProps } from "./column-picker";

type TableViewOptionsProps = {
  columns: ColumnPickerProps["columns"];
  visible: ColumnPickerProps["visible"];
  onVisibleChange: ColumnPickerProps["onChange"];
};

export function TableViewOptions({
  columns,
  visible,
  onVisibleChange,
}: TableViewOptionsProps) {
  return (
    <div className="flex items-center gap-1">
      <ColumnPicker
        columns={columns}
        visible={visible}
        onChange={onVisibleChange}
      />
    </div>
  );
}
