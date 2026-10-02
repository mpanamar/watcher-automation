import { render, screen, waitFor } from "@testing-library/preact";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/web/App";

describe("Watcher app", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
    localStorage.clear();
  });

  it("shows an error when Confirm is empty", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Name the watch" });

    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(document.getElementById("hint")).toHaveTextContent("Select a line or type a name.");
  });

  it("shows a hint after a wrong choice", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Name the watch" });

    await user.click(screen.getByRole("button", { name: /Rolex Submariner Date/ }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    await waitFor(() => {
      expect(document.getElementById("hint")).toHaveTextContent(/wave dial/i);
    });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeEnabled();
  });

  it("opens the dossier and disables Confirm after a correct ident", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Name the watch" });

    await user.click(screen.getByRole("button", { name: /Omega Seamaster Diver 300M/ }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));

    expect(await screen.findByRole("heading", { name: "Omega Seamaster Diver 300M" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Official catalogue" })).toBeInTheDocument();
  });

  it("does not expose admin-only answer or hint fields on the quiz route", async () => {
    render(<App />);
    await screen.findByRole("heading", { name: "Name the watch" });

    expect(screen.queryByLabelText(/^answer$/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^hint$/i)).not.toBeInTheDocument();
  });

  it("keeps identified count when moving through the queue", async () => {
    const user = userEvent.setup();
    render(<App />);
    await screen.findByRole("heading", { name: "Name the watch" });

    await user.click(screen.getByRole("button", { name: /Omega Seamaster Diver 300M/ }));
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await screen.findByRole("heading", { name: "Omega Seamaster Diver 300M" });

    await user.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText(/driver's wrist/i);
    expect(screen.getByText("1 / 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    await screen.findByRole("heading", { name: "Omega Seamaster Diver 300M" });
    expect(screen.getByRole("button", { name: "Confirm" })).toBeDisabled();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});
