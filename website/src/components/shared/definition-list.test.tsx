import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DefinitionList } from "./definition-list";

describe("DefinitionList", () => {
  it("renders labels and unavailable values semantically", () => {
    render(
      <DefinitionList
        items={[
          { label: "Version", value: "4.4.0" },
          { label: "Missing", value: null },
        ]}
        unavailableLabel="Unavailable"
      />,
    );

    expect(screen.getByText("Version").tagName).toBe("DT");
    expect(screen.getByText("4.4.0").tagName).toBe("DD");
    expect(screen.getByText("Unavailable")).toBeInTheDocument();
  });
});
