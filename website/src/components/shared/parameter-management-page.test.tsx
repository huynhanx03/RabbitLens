import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ParameterManagementPage } from "./parameter-management-page";

type LinkProps = React.ComponentProps<"a"> & { params: Record<string, string>; to: string };

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, params: _params, to: _to, ...props }: LinkProps) => (
    <a {...props}>{children}</a>
  ),
}));
vi.mock("./async-state", () => ({
  AsyncState: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("./data-table", () => ({
  DataTable: ({
    columns,
    data,
  }: {
    columns: { id?: string; cell?: (context: never) => React.ReactNode }[];
    data: unknown[];
  }) => (
    <div aria-label="Parameters" role="grid">
      {data.map((row) => (
        <div key={JSON.stringify(row)}>
          {columns.map((column) => column.cell?.({ row: { original: row } } as never))}
        </div>
      ))}
    </div>
  ),
}));
vi.mock("./json-parameter-form", () => ({
  JsonParameterForm: ({
    onCancel,
    onSubmit,
    vhosts,
  }: {
    onCancel: () => void;
    onSubmit: (input: unknown) => void;
    vhosts: string[];
  }) => (
    <div>
      <span>{vhosts.join(",")}</span>
      <button
        onClick={() =>
          onSubmit({ name: "new-upstream", value: { uri: "amqp://host" }, vhost: "/" })
        }
        type="button"
      >
        Save parameter
      </button>
      <button onClick={onCancel} type="button">
        Cancel parameter
      </button>
    </div>
  ),
}));
vi.mock("./mutation-error-alert", () => ({ MutationErrorAlert: () => null }));
vi.mock("./confirm-dialog", () => ({
  ConfirmDialog: ({
    onConfirm,
    open,
    title,
  }: {
    onConfirm: () => void;
    open: boolean;
    title: string;
  }) =>
    open ? (
      <button onClick={onConfirm} type="button">
        {title}
      </button>
    ) : null,
}));
vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ children, open }: { children: React.ReactNode; open: boolean }) =>
    open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}));

type Parameter = { name: string; value: Record<string, unknown>; vhost: string };

function renderPage(
  overrides: Partial<React.ComponentProps<typeof ParameterManagementPage<Parameter>>> = {},
) {
  const onDelete = vi.fn();
  const onSave = vi.fn();
  const rendered = render(
    <ParameterManagementPage
      addLabel="Add upstream"
      data={[{ name: "orders", value: { uri: "amqp://secret" }, vhost: "/" }]}
      defaultValue={{ uri: "amqp://default" }}
      deleteDescription={(name) => `Delete ${name}?`}
      deleteError={null}
      deleteTitle="Delete upstream"
      detailPath="/extensions/federation/upstreams/$vhost/$name"
      emptyTitle="No upstreams"
      error={null}
      isDeleting={false}
      isError={false}
      isPending={false}
      isSaving={false}
      onDelete={onDelete}
      onRetry={vi.fn()}
      onSave={onSave}
      redactValue={() => ({ uri: "[redacted]" })}
      saveError={null}
      tableLabel="Federation upstreams"
      vhosts={["/"]}
      {...overrides}
    />,
  );
  return { ...rendered, onDelete, onSave };
}

describe("ParameterManagementPage", () => {
  it("opens the shared create form, forwards a typed payload and closes after success", async () => {
    const user = userEvent.setup();
    const { onSave } = renderPage();

    await user.click(screen.getByRole("button", { name: "Add upstream" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("/");
    await user.click(screen.getByRole("button", { name: "Save parameter" }));

    expect(onSave).toHaveBeenCalledWith(
      { name: "new-upstream", value: { uri: "amqp://host" }, vhost: "/" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    act(() => onSave.mock.calls[0][1].onSuccess());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("requires an explicit delete confirmation and clears the target after success", async () => {
    const user = userEvent.setup();
    const { onDelete } = renderPage();

    await user.click(screen.getByRole("button", { name: "Delete orders" }));
    await user.click(screen.getByRole("button", { name: "Delete upstream" }));

    expect(onDelete).toHaveBeenCalledWith(
      { name: "orders", value: { uri: "amqp://secret" }, vhost: "/" },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    act(() => onDelete.mock.calls[0][1].onSuccess());
    expect(screen.queryByRole("button", { name: "Delete upstream" })).not.toBeInTheDocument();
  });

  it("renders redacted values and supports cancellation or an undefined query result", async () => {
    const user = userEvent.setup();
    const { rerender } = renderPage();

    expect(screen.getByText('{"uri":"[redacted]"}')).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Add upstream" }));
    await user.click(screen.getByRole("button", { name: "Cancel parameter" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <ParameterManagementPage
        addLabel="Add upstream"
        data={undefined}
        defaultValue={{}}
        deleteDescription={(name) => `Delete ${name}?`}
        deleteError={null}
        deleteTitle="Delete upstream"
        detailPath="/extensions/federation/upstreams/$vhost/$name"
        emptyTitle="No upstreams"
        error={null}
        isDeleting={false}
        isError={false}
        isPending={false}
        isSaving={false}
        onDelete={vi.fn()}
        onRetry={vi.fn()}
        onSave={vi.fn()}
        redactValue={(value) => value}
        saveError={null}
        tableLabel="Federation upstreams"
        vhosts={[]}
      />,
    );
    expect(screen.getByRole("grid")).toBeEmptyDOMElement();
  });
});
