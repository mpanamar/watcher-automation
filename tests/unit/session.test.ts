import { describe, expect, it } from "vitest";
import { createSession, isLocked, lockCase, moveCase, pruneLocked, score } from "../../src/domain/session";

describe("session", () => {
  it("starts at the first case with an empty lock set", () => {
    const session = createSession();
    expect(session.index).toBe(0);
    expect(session.locked.size).toBe(0);
  });

  it("wraps the queue forward and backward", () => {
    const started = createSession();
    const next = moveCase(started, 3, 1);
    const wrapped = moveCase(moveCase(moveCase(started, 3, 1), 3, 1), 3, 1);
    const prev = moveCase(started, 3, -1);

    expect(next.index).toBe(1);
    expect(wrapped.index).toBe(0);
    expect(prev.index).toBe(2);
  });

  it("locks a case without moving the queue", () => {
    const session = lockCase(createSession(), "W-07");
    expect(isLocked(session, "W-07")).toBe(true);
    expect(isLocked(session, "W-11")).toBe(false);
    expect(session.index).toBe(0);
    expect(score(session, 3)).toEqual({ identified: 1, total: 3 });
  });

  it("drops lock ids that are no longer in the catalog", () => {
    const session = lockCase(lockCase(createSession(), "W-07"), "W-99");
    const pruned = pruneLocked(session, new Set(["W-07", "W-11"]));
    expect([...pruned.locked]).toEqual(["W-07"]);
    expect(score(pruned, 2)).toEqual({ identified: 1, total: 2 });
  });
});
