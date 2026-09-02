import { useEffect, useRef } from "react";

/** Resets local controlled-dialog state on an open-to-closed parent transition. */
export function useResetOnClose(open: boolean, reset: () => void) {
  const wasOpen = useRef(open);

  useEffect(() => {
    if (wasOpen.current && !open) reset();
    wasOpen.current = open;
  }, [open, reset]);
}
