import { cleanup } from "@testing-library/preact";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetIdentified } from "./handlers";
import { server } from "./msw-server";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
  }),
});

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  resetIdentified();
  server.resetHandlers();
  sessionStorage.clear();
  window.history.pushState({}, "", "/");
});
afterAll(() => server.close());
