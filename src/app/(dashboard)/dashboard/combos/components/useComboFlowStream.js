"use client";

import { useEffect, useState } from "react";

/**
 * Live combo activity from the usage stream.
 *
 * The usage page already streams activeRequests / recentRequests / errorProvider
 * over SSE; the Combo Flow card only needs those three fields, so it opens its own
 * lightweight connection and closes it on unmount. Any failure leaves the card
 * hidden (empty defaults) rather than throwing into the page.
 */
export default function useComboFlowStream() {
  const [state, setState] = useState({ activeRequests: [], recentRequests: [], errorProvider: "" });

  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return undefined;
    let es;
    try {
      es = new EventSource("/api/usage/stream");
    } catch {
      return undefined;
    }

    const onMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data || Array.isArray(data)) return;
        setState({
          activeRequests: Array.isArray(data.activeRequests) ? data.activeRequests : [],
          recentRequests: Array.isArray(data.recentRequests) ? data.recentRequests : [],
          errorProvider: data.errorProvider || "",
        });
      } catch {
        /* ignore malformed frames */
      }
    };

    es.addEventListener("message", onMessage);
    es.onerror = () => {
      // EventSource retries on its own; keep last known state.
    };

    return () => {
      es.removeEventListener("message", onMessage);
      es.close();
    };
  }, []);

  return state;
}
