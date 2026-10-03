import type { PublicWatchCase } from "../domain/cases";
import {
  identResponseSchema,
  publicCaseListSchema,
  publicCaseSchema,
  sessionResponseSchema,
  type Dossier,
  type IdentResponse,
  type SessionResponse,
} from "../server/http-schemas";

export type { Dossier, IdentResponse, PublicWatchCase, SessionResponse };

async function readJson(response: Response): Promise<unknown> {
  return response.json();
}

export async function getCases(): Promise<PublicWatchCase[]> {
  const response = await fetch("/api/cases");
  if (!response.ok) throw new Error("Could not load cases");
  return publicCaseListSchema.parse(await readJson(response));
}

export async function getCase(id: string): Promise<PublicWatchCase> {
  const response = await fetch(`/api/cases/${id}`);
  if (response.status === 404) throw new Error("Case not found");
  if (!response.ok) throw new Error("Could not load case");
  return publicCaseSchema.parse(await readJson(response));
}

export async function getSession(): Promise<SessionResponse> {
  const response = await fetch("/api/session");
  if (!response.ok) throw new Error("Could not load session");
  return sessionResponseSchema.parse(await readJson(response));
}

export async function postIdent(id: string, guess: string): Promise<IdentResponse> {
  const response = await fetch(`/api/cases/${id}/ident`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ guess }),
  });
  const body = await readJson(response);
  if (response.status === 400) throw new Error("Select a line or type a name.");
  if (response.status === 404) throw new Error("Case not found");
  if (!response.ok) throw new Error("Ident failed");
  return identResponseSchema.parse(body);
}

export function stillSrc(path: string): string {
  if (path.startsWith("/") || path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  return `/${path}`;
}
