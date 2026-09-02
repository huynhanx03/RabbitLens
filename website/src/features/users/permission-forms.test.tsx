import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/render";
import { PermissionForm } from "./permission-form";
import { TopicPermissionForm } from "./topic-permission-form";

vi.mock("@/domains/admin/vhosts/vhost-query", () => ({
  useVhosts: () => ({ data: [{ name: "/" }], isPending: false }),
}));

describe("RabbitMQ permission forms", () => {
  it("submits a selected virtual host with regular permissions", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<PermissionForm apiClient={{} as never} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("combobox", { name: "Virtual Host" }));
    await userEvent.click(screen.getByRole("option", { name: "/" }));
    await userEvent.click(screen.getByRole("button", { name: "Set permission" }));

    expect(onSubmit).toHaveBeenCalledWith("/", {
      vhost: "/",
      configure: ".*",
      write: ".*",
      read: ".*",
    });
  });

  it("submits the exchange scope with topic permissions", async () => {
    const onSubmit = vi.fn();
    renderWithProviders(<TopicPermissionForm apiClient={{} as never} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("combobox", { name: "Virtual Host" }));
    await userEvent.click(screen.getByRole("option", { name: "/" }));
    await userEvent.type(screen.getByLabelText("Exchange (Regex or specific name)"), "events");
    await userEvent.click(screen.getByRole("button", { name: "Set topic permission" }));

    expect(onSubmit).toHaveBeenCalledWith("/", {
      vhost: "/",
      exchange: "events",
      write: ".*",
      read: ".*",
    });
  });
});
