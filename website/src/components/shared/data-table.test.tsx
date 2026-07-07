import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ColumnDef } from "@tanstack/react-table";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { DataTable } from "./data-table";

type Row = { name: string; state: string };

const columns: ColumnDef<Row>[] = [
  { accessorKey: "name", header: "Name", meta: { variant: "code", wrap: "break" } },
  {
    accessorKey: "state",
    header: "State",
    meta: { align: "center", className: "hidden md:table-cell", variant: "status" },
    enableSorting: true,
  },
  {
    id: "actions",
    header: "Actions",
    meta: { align: "center", variant: "actions" },
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
    expect(
      screen.getByRole("table", { name: "Connections" }).parentElement,
    ).toHaveClass("rl-data-table");
    expect(
      screen.getByRole("table", { name: "Connections" }).parentElement,
    ).toHaveClass("rounded-lg");
    expect(
      screen.getByRole("table", { name: "Connections" }).parentElement,
    ).not.toHaveClass("rounded-xl");
    expect(
      screen.getByRole("table", { name: "Connections" }).parentElement,
    ).not.toHaveClass("rounded-2xl");
    expect(screen.getAllByRole("rowgroup")[0]).toHaveClass("sticky");
    expect(screen.getByRole("columnheader", { name: "State" })).toHaveClass(
      "hidden",
      "md:table-cell",
      "text-center",
    );
    expect(screen.getByRole("columnheader", { name: "Actions" })).toHaveClass(
      "w-12",
      "text-center",
    );
    expect(screen.getByRole("cell", { name: "client-1" })).toHaveClass(
      "font-mono",
      "whitespace-normal",
      "break-all",
    );
    expect(screen.getByRole("cell", { name: "running" })).toHaveClass(
      "text-center",
    );
    expect(screen.getByRole("row", { name: /client-1/i })).toHaveClass(
      "rl-data-row",
    );
    expect(screen.getByRole("button", { name: /State/i })).toHaveClass(
      "rl-sort-control",
      "justify-center",
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

    expect(screen.getByText("No matching connections").parentElement).toHaveClass(
      "rl-table-empty",
    );
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
