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
    await user.type(screen.getByLabelText(/^case id$/i), "W-99");
    await user.type(screen.getByLabelText(/^question$/i), "Which watch?");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    const labelInputs = screen.getAllByLabelText(/label$/i);
    await user.type(labelInputs[0], "Option A");
    await user.type(labelInputs[1], "Option B");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Save" })).toBeEnabled();
    });
  });

  it("saves a published case to Supabase and shows it in the list", async () => {
    setSupabaseMockSession({ user: { id: "admin-user-id", email: "admin@example.com" } });
    setSupabaseMockAdminEmails(["admin@example.com"]);
    window.history.pushState({}, "", "/admin/cases/new");
    render(<App />);
    await screen.findByRole("heading", { name: "New case" });

    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/^case id$/i), "W-99");
    await user.click(screen.getByLabelText(/^published$/i));
    const file = new File(["x"], "still.png", { type: "image/png" });
    await user.upload(screen.getByLabelText(/^still image$/i), file);
    await user.type(screen.getByLabelText(/^still alt text$/i), "Alt");
    await user.type(screen.getByLabelText(/^source$/i), "Film");
    await user.type(screen.getByLabelText(/^subject$/i), "Actor");
    await user.type(screen.getByLabelText(/^frame$/i), "00:01:00");
    await user.type(screen.getByLabelText(/^question$/i), "Which watch?");
    const labelInputs = screen.getAllByLabelText(/label$/i);
    await user.type(labelInputs[0], "Omega");
    await user.type(labelInputs[1], "Rolex");
    await user.type(screen.getByLabelText(/^answer$/i), "Omega");
    await user.type(screen.getByLabelText(/^alias 1$/i), "omega");
    await user.type(screen.getByLabelText(/^hint$/i), "Hint text");
    await user.type(screen.getByLabelText(/^dossier title$/i), "Omega Watch");
    await user.type(screen.getByLabelText(/^reference$/i), "REF");
    await user.type(screen.getByLabelText(/^history$/i), "History");
    await user.type(screen.getByLabelText(/^buy new url$/i), "https://example.com/new");
    await user.type(screen.getByLabelText(/^buy used url$/i), "https://example.com/used");

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByRole("heading", { name: "Cases" })).toBeInTheDocument();
    expect(await screen.findByText("W-99")).toBeInTheDocument();
    expect(screen.getByText("Published")).toBeInTheDocument();
    expect(screen.queryByText(/saved locally/i)).not.toBeInTheDocument();
  });
});
