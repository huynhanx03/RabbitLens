import { render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { useResetOnClose } from "./use-reset-on-close";

function ControlledDraft({ open }: { open: boolean }) {
  const [draft, setDraft] = useState("saved draft");
  useResetOnClose(open, () => setDraft(""));
  return <output>{draft}</output>;
}

describe("useResetOnClose", () => {
  it("clears local state when a controlled parent closes its dialog", () => {
    const view = render(<ControlledDraft open />);
    expect(screen.getByText("saved draft")).toBeVisible();

    view.rerender(<ControlledDraft open={false} />);
    expect(screen.getByRole("status")).toHaveTextContent("");
  });
});
