"use client";

import { useEffect, useState } from "react";

/** Returns true only after the component has mounted on the client. Avoids hydration mismatches with persisted state. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}

