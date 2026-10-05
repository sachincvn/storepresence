"use client";

import { useEffect, useMemo, useRef, useState, type Dispatch } from "react";
import { loadSession, saveSession } from "@/lib/projectStore";
import type { EditorState } from "./editorState";
import type { HistoryAction, SavedSession } from "./history";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

/** Quiet time after the last edit before saving. */
const SAVE_DELAY_MS = 500;

/**
 * Restores the last session from this browser on mount, then saves after every change.
 * `templateId` (from the URL) replaces the saved template when given.
 */
export function useAutosave(state: EditorState, dispatch: Dispatch<HistoryAction>, templateId?: string): SaveStatus {
  const [status, setStatus] = useState<SaveStatus>("idle");
  // Nothing is saved before the load finishes, so an empty start never overwrites real work.
  const [loaded, setLoaded] = useState(false);
  const { project, slide, usingSamples } = state;
  const session = useMemo<SavedSession>(() => ({ project, slide, usingSamples }), [project, slide, usingSamples]);

  const initialTemplate = useRef(templateId);
  useEffect(() => {
    let active = true;
    loadSession()
      .then((saved) => {
        if (active && saved) dispatch({ type: "restore", session: saved, templateId: initialTemplate.current });
      })
      .catch((error) => console.warn("Autosave unavailable:", error))
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [dispatch]);

  const pending = useRef<SavedSession | null>(null);
  /** Saves run one at a time, in order. */
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    if (!loaded) return;
    const flush = () => {
      const next = pending.current;
      if (!next) return;
      pending.current = null;
      setStatus("saving");
      queue.current = queue.current
        .then(() => saveSession(next))
        .then(
          () => setStatus("saved"),
          (error) => {
            console.warn("Autosave failed:", error);
            setStatus("error");
          },
        );
    };

    pending.current = session;
    const timer = setTimeout(flush, SAVE_DELAY_MS);
    // Leaving or hiding the tab saves right away instead of waiting.
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [loaded, session]);

  return status;
}
