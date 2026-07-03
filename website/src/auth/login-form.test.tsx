import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test/render";
import { LoginForm } from "./login-form";
import { useAuth } from "./auth-context";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => ({ redirect: undefined }),
}));

function TestWrapper() {
  const auth = useAuth();
  return (
    <div>
      <div data-testid="auth-state">{auth.session.type}</div>
      <LoginForm />
    </div>
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it("shows required field errors", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);
    
    await user.click(screen.getByRole("button", { name: /sign in|đăng nhập/i }));
    
    expect(await screen.findByText(/enter a username/i)).toBeInTheDocument();
    expect(await screen.findByText(/enter a password/i)).toBeInTheDocument();
  });

  it("authenticates successfully and clears password field", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);
    
    await user.type(screen.getByLabelText(/username/i), "guest");
    await user.type(screen.getByLabelText(/^password$/i), "guest");
    await user.click(screen.getByRole("button", { name: /sign in|đăng nhập/i }));
    
    await waitFor(() => {
      expect(screen.getByTestId("auth-state")).toHaveTextContent("basic");
    });
    
    expect(screen.getByLabelText(/^password$/i)).toHaveValue("");
    expect(localStorage.getItem("authorization")).toBeNull();
    expect(sessionStorage.getItem("authorization")).toBeNull();
  });

  it("shows 401 error on invalid credentials", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);
    
    await user.type(screen.getByLabelText(/username/i), "guest");
    await user.type(screen.getByLabelText(/^password$/i), "invalid");
    await user.click(screen.getByRole("button", { name: /sign in|đăng nhập/i }));
    
    expect(await screen.findByText(/rejected these credentials/i)).toBeInTheDocument();
    expect(screen.getByTestId("auth-state")).toHaveTextContent("anonymous");
  });

  it("uses secure autocomplete fields and toggles password visibility", async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestWrapper />);

    const username = screen.getByLabelText(/username/i);
    const password = screen.getByLabelText(/^password$/i);
    expect(username).toHaveAttribute("autocomplete", "username");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(password).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Hide password" })).toBeVisible();
  });
});
