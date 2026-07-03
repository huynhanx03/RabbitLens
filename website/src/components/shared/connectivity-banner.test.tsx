import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectivityBanner } from "./connectivity-banner";

describe("ConnectivityBanner", () => {
  it("shows a persistent offline state and clears after reconnect", () => {
    render(<ConnectivityBanner />);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("alert")).toHaveTextContent("You are offline");

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
