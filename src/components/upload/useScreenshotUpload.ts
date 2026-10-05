"use client";

import { useCallback, useState, type Dispatch } from "react";
import type { Screenshot } from "@/types/project";
import type { ImageSlotKey } from "@/types/template";
import { isAcceptedFile, MAX_SCREENSHOTS, readScreenshot } from "@/lib/upload";
import { forgetImage } from "@/renderer/templateRenderer";
import type { EditorAction } from "@/components/editor/editorState";

/**
 * Frees an uploaded screenshot's memory. Samples use data URLs and need nothing.
 * The editor calls this once no undo step references the image, so removing never frees directly.
 */
export function releaseScreenshot(screenshot: Screenshot): void {
  if (!screenshot.url.startsWith("blob:")) return;
  URL.revokeObjectURL(screenshot.url);
  forgetImage(screenshot.url);
}

type Options = {
  dispatch: Dispatch<EditorAction>;
  /** Uploads already in the set (0 while samples are shown). */
  uploadedCount: number;
};

export function useScreenshotUpload({ dispatch, uploadedCount }: Options) {
  const [pending, setPending] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  /** Short message for screen readers after each change. */
  const [notice, setNotice] = useState("");

  const addFiles = useCallback(
    async (list: FileList | File[]) => {
      const problems: string[] = [];
      const accepted = [...list].filter((file) => {
        if (isAcceptedFile(file)) return true;
        problems.push(`${file.name} isn't supported. Use PNG, JPG or WEBP.`);
        return false;
      });

      const room = Math.max(0, MAX_SCREENSHOTS - uploadedCount);
      if (accepted.length > room) {
        problems.push(`A set holds up to ${MAX_SCREENSHOTS} screenshots. ${accepted.length - room} not added.`);
        accepted.length = room;
      }

      setPending(accepted.length);
      const results = await Promise.allSettled(accepted.map(readScreenshot));
      const screenshots: Screenshot[] = [];
      results.forEach((result, i) => {
        if (result.status === "fulfilled") screenshots.push(result.value);
        else problems.push(`Couldn't read ${accepted[i].name}. Try exporting it again as PNG.`);
      });

      if (screenshots.length > 0) {
        dispatch({ type: "addScreenshots", screenshots });
        setNotice(`Added ${screenshots.length} screenshot${screenshots.length === 1 ? "" : "s"}.`);
      }
      setErrors(problems);
      setPending(0);
    },
    [dispatch, uploadedCount],
  );

  const replaceFile = useCallback(
    async (current: Screenshot, file: File) => {
      if (!isAcceptedFile(file)) {
        setErrors([`${file.name} isn't supported. Use PNG, JPG or WEBP.`]);
        return;
      }
      setPending(1);
      try {
        const screenshot = await readScreenshot(file);
        dispatch({ type: "replaceScreenshot", id: current.id, screenshot });
        setNotice(`Replaced ${current.name} with ${file.name}.`);
        setErrors([]);
      } catch {
        setErrors([`Couldn't read ${file.name}. Try exporting it again as PNG.`]);
      } finally {
        setPending(0);
      }
    },
    [dispatch],
  );

  const remove = useCallback(
    (screenshot: Screenshot) => {
      dispatch({ type: "removeScreenshot", id: screenshot.id });
      setNotice(`Removed ${screenshot.name}.`);
    },
    [dispatch],
  );

  /** App icon, logo or mascot. Replaces any previous image for that slot. */
  const setImage = useCallback(
    async (key: ImageSlotKey, file: File | null) => {
      if (!file) {
        dispatch({ type: "image", key, image: null });
        setNotice("Image removed.");
        return;
      }
      if (!isAcceptedFile(file)) {
        setErrors([`${file.name} isn't supported. Use PNG, JPG or WEBP.`]);
        return;
      }
      try {
        const image = await readScreenshot(file);
        dispatch({ type: "image", key, image });
        setNotice(`Added ${file.name}.`);
        setErrors([]);
      } catch {
        setErrors([`Couldn't read ${file.name}. Try exporting it again as PNG.`]);
      }
    },
    [dispatch],
  );

  return { addFiles, replaceFile, remove, setImage, pending, errors, notice, dismissErrors: () => setErrors([]) };
}
