import { useEffect, useState } from "preact/hooks";
import { resolveAdminGate, subscribeAdminAuth, type AdminGateState } from "./admin-auth.ts";

export function useAdminGate(): AdminGateState {
  const [gate, setGate] = useState<AdminGateState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const next = await resolveAdminGate();
      if (!cancelled) setGate(next);
    }

    void refresh();
    const unsubscribe = subscribeAdminAuth(() => {
      void refresh();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  return gate;
}
