import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DataTable } from "./data-table";

type Row = { name: string; state: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name" },
  {
    accessorKey: "state",
    header: "State",
    meta: { className: "hidden md:table-cell" },
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => <button type="button">Open menu</button>,
  },
];

describe("DataTable", () => {
  it("provides a labelled, sticky and responsive table surface", () => {
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={columns}
        data={[{ name: "client-1", state: "running" }]}
      />,
    );

    expect(screen.getByRole("table", { name: "Connections" })).toBeVisible();
    expect(screen.getAllByRole("rowgroup")[0]).toHaveClass("sticky");
    expect(screen.getByRole("columnheader", { name: "State" })).toHaveClass(
      "hidden",
      "md:table-cell",
    );
  });

  it("renders a supplied empty state", () => {
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={columns}
        data={[]}
        emptyState={<div>No matching connections</div>}
      />,
    );

    expect(screen.getByText("No matching connections")).toBeVisible();
  });

  it("does not activate the row from an interactive child", async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    renderWithProviders(
      <DataTable
        ariaLabel="Connections"
        columns={columns}
        data={[{ name: "client-1", state: "running" }]}
        onRowClick={onRowClick}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(onRowClick).not.toHaveBeenCalled();
    await user.click(screen.getByText("client-1"));
    expect(onRowClick).toHaveBeenCalledOnce();
  });
});
