import type { AddressInfo } from "node:net";
import { createApp } from "../../src/server/app";

export async function startTestServer(): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createApp();
  const server = app.listen(0);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.once("listening", () => resolve());
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    await closeServer();
    throw new Error("Test server did not bind a port");
  }

  async function closeServer(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  return { url: `http://127.0.0.1:${(address as AddressInfo).port}`, close: closeServer };
}

export function hasSpoilerKeys(value: unknown): boolean {
  const raw = JSON.stringify(value);
  return raw.includes('"answer"') || raw.includes('"aliases"');
}
