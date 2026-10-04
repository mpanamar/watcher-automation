import { cleanup } from "@testing-library/preact";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { __setSupabaseClientForTests } from "../../src/web/supabase.ts";
import { resetIdentified } from "./handlers";
import { server } from "./msw-server";
import { resetSupabaseMock } from "./supabase-client-mock";

if (!URL.createObjectURL) {
  URL.createObjectURL = () => "blob:mock-preview";
} else {
  const nativeCreateObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj: Blob | MediaSource) => {
    try {
      return nativeCreateObjectURL(obj);
    } catch {
      return "blob:mock-preview";
    }
  };
}

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
  resetSupabaseMock();
  __setSupabaseClientForTests(undefined);
  server.resetHandlers();
  sessionStorage.clear();
  localStorage.clear();
  window.history.pushState({}, "", "/");
});
afterAll(() => server.close());
