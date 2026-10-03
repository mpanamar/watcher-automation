import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/web/App";
import { __setSupabaseClientForTests } from "../../src/web/supabase.ts";
import {
  createSupabaseMockClient,
  resetSupabaseMock,
  setSupabaseMockAdminEmails,
  setSupabaseMockSession,
  setSupabaseMockSignInError,
} from "./supabase-client-mock";

describe("Admin shell", () => {
  beforeEach(() => {
    resetSupabaseMock();
    __setSupabaseClientForTests(createSupabaseMockClient());
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

  it("shows an auth error on a wrong password", async () => {
    setSupabaseMockSignInError("Invalid login credentials");
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Admin sign in" });

    await user.type(screen.getByLabelText(/^email$/i), "admin@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/invalid login credentials/i);
    expect(screen.queryByRole("heading", { name: "Cases" })).not.toBeInTheDocument();
  });

  it("opens the case list when the session belongs to an admin", async () => {
    setSupabaseMockSession({ user: { id: "admin-user-id", email: "admin@example.com" } });
    setSupabaseMockAdminEmails(["admin@example.com"]);
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Cases" })).toBeInTheDocument();
  });

  it("redirects /admin to the login form without a session", async () => {
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Admin sign in" })).toBeInTheDocument();
  });

  it("does not treat the old local session flag as signed in", async () => {
    sessionStorage.setItem("watcher-admin-local", "1");
    window.history.pushState({}, "", "/admin");
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Admin sign in" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Cases" })).not.toBeInTheDocument();
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
    setSupabaseMockSession({ user: { id: "admin-user-id", email: "admin@example.com" } });
    setSupabaseMockAdminEmails(["admin@example.com"]);
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
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });
  });
});
