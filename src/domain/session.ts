export type Session = {
  index: number;
  locked: ReadonlySet<string>;
};

export function createSession(): Session {
  return { index: 0, locked: new Set() };
}

export function moveCase(session: Session, total: number, delta: number): Session {
  if (total <= 0) return session;
  const index = (session.index + delta + total) % total;
  return { ...session, index };
}

export function lockCase(session: Session, caseId: string): Session {
  const locked = new Set(session.locked);
  locked.add(caseId);
  return { ...session, locked };
}

export function isLocked(session: Session, caseId: string): boolean {
  return session.locked.has(caseId);
}

export function score(session: Session, total: number): { identified: number; total: number } {
  return { identified: session.locked.size, total };
}

/** Drops lock ids that are no longer in the published catalog. */
export function pruneLocked(session: Session, validIds: ReadonlySet<string>): Session {
  const locked = new Set<string>();
  for (const id of session.locked) {
    if (validIds.has(id)) locked.add(id);
  }
  if (locked.size === session.locked.size) return session;
  return { ...session, locked };
}
