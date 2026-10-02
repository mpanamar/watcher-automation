import { render, screen } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/web/App";
import { signInLocal } from "../../src/web/admin/admin-auth.ts";

describe("Admin shell", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/admin/login");
    sessionStorage.clear();
    localStorage.clear();
  });

  it("shows an error when login fields are empty", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Admin sign in" });

    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/email and password/i);
  });

  it("does not expose the password in visible page text", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Admin sign in" });

    const secret = "local-only-secret";
    await user.type(screen.getByLabelText(/^password$/i), secret);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(document.body.textContent).not.toContain(secret);
  });

  it("blocks Save when question is empty or fewer than two options", async () => {
    signInLocal();
    window.history.pushState({}, "", "/admin/cases/new");
    render(<App />);
    await screen.findByRole("heading", { name: "New case" });

    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^question$/i), "Which watch?");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const labelInputs = screen.getAllByLabelText(/label$/i);
    await user.type(labelInputs[0], "Option A");
    await user.type(labelInputs[1], "Option B");
    expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
  });
});
