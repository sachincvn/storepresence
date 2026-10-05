"use client";

import { useCallback, useEffect, useReducer, useRef, useState, type DragEvent } from "react";
import { Logo } from "@/components/landing/Logo";
import { TemplatePicker } from "@/components/templates/TemplatePicker";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { ScreenshotPanel } from "@/components/upload/ScreenshotPanel";
import { releaseScreenshot, useScreenshotUpload } from "@/components/upload/useScreenshotUpload";
import { downloadBlob } from "@/lib/download";
import { createSampleScreenshots } from "@/lib/sampleShots";
import { buildZip, zipName } from "@/lib/zip";
import { exportSet, exportSlide } from "@/renderer/exportRenderer";
import { getTemplate, templates } from "@/templates/registry";
import { getSlideCount, usedImageSlots } from "@/templates/resolve";
import type { Screenshot } from "@/types/project";
import { BrandImages } from "@/components/upload/BrandImages";
import type { EditorAction } from "./editorState";
import { canRedo, canUndo, historyReducer, initialHistory, referencedImages } from "./history";
import { useAutosave } from "./useAutosave";
import { Inspector, type InspectorSection } from "./Inspector";
import { PreviewArea, type View } from "./PreviewArea";
import { useLayoutMode } from "./useLayoutMode";

const SHEET_TITLES: Record<InspectorSection, string> = {
  screenshots: "Screenshots",
  layout: "Layout",
  text: "Text",
  style: "Style",
};

type EditorProps = {
  initialTemplateId: string;
  /** True when the URL picked the template; it then wins over the autosaved one. */
  templateFromUrl?: boolean;
};

export function Editor({ initialTemplateId, templateFromUrl = false }: EditorProps) {
  const [history, dispatchHistory] = useReducer(historyReducer, initialTemplateId, initialHistory);
  const state = history.present;
  // Edits carry a timestamp so a burst of typing becomes one undo step.
  const dispatch = useCallback((action: EditorAction) => dispatchHistory({ ...action, at: Date.now() }), []);
  const undo = useCallback(() => dispatchHistory({ type: "undo" }), []);
  const redo = useCallback(() => dispatchHistory({ type: "redo" }), []);
  const saveStatus = useAutosave(state, dispatchHistory, templateFromUrl ? initialTemplateId : undefined);
  const mode = useLayoutMode();
  const [view, setView] = useState<View>("slide");
  const [sheet, setSheet] = useState<InspectorSection | null>(null);
  /** Button that opened the sheet; focus returns to it on close (mobile taps don't always focus). */
  const sheetTrigger = useRef<HTMLButtonElement | null>(null);
  /** null = idle; otherwise a short status for the export buttons. */
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const { project, slide } = state;
  const template = getTemplate(project.templateId) ?? templates[0];
  const slideCount = getSlideCount(template, project);
  const upload = useScreenshotUpload({ dispatch, uploadedCount: state.usingSamples ? 0 : project.screenshots.length });
  // One app name for templates, the store preview and the ZIP file name.
  const appName = project.variables.appName ?? "Taskly";
  const setAppName = (value: string) => dispatch({ type: "variable", key: "appName", value, perSlide: false });
  const imageSlots = usedImageSlots(template);

  // Uploaded images stay in memory while any undo step can show them, and are freed after.
  const liveImages = useRef(new Map<string, Screenshot>());
  useEffect(() => {
    const referenced = referencedImages(history);
    liveImages.current.forEach((image, url) => referenced.has(url) || releaseScreenshot(image));
    liveImages.current = referenced;
  }, [history]);
  useEffect(() => () => liveImages.current.forEach(releaseScreenshot), []);

  // Undo/redo shortcuts. Text fields keep their own undo for typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.isContentEditable || target.matches("textarea, input:not([type=checkbox], [type=radio], [type=color], [type=file], [type=button])")) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) undo();
      else if ((key === "z" && e.shiftKey) || key === "y") redo();
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Sample screenshots need canvas, so they are created after mount.
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) dispatch({ type: "samplesReady", samples: createSampleScreenshots() });
    });
    return () => {
      active = false;
    };
  }, [dispatch]);

  // Keep the URL shareable as the template changes.
  useEffect(() => {
    window.history.replaceState(null, "", `?template=${template.id}`);
  }, [template.id]);

  async function runExport(task: () => Promise<void>) {
    setExportError(null);
    try {
      await task();
    } catch (error) {
      console.error(error);
      setExportError("Export failed. Your work is safe, try again.");
    } finally {
      setExportStatus(null);
    }
  }

  const exportCurrent = () =>
    runExport(async () => {
      setExportStatus("Exporting…");
      const file = await exportSlide(template, project, slide);
      downloadBlob(file.blob, file.name);
    });

  const exportZip = () =>
    runExport(async () => {
      setExportStatus(`Rendering 0 of ${slideCount}…`);
      const files = await exportSet(template, project, (done, total) => setExportStatus(`Rendering ${done} of ${total}…`));
      setExportStatus("Zipping…");
      downloadBlob(await buildZip(files), zipName(appName));
    });

  // Page-wide drop target: files can land anywhere in the editor.
  const hasFiles = (e: DragEvent) => e.dataTransfer.types.includes("Files");
  const dropHandlers = {
    onDragOver: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(true);
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
    },
    onDrop: (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      setDragging(false);
      upload.addFiles(e.dataTransfer.files);
    },
  };

  const selectTemplate = (id: string) => dispatch({ type: "template", id });
  const selectSlide = (index: number) => dispatch({ type: "slide", index });

  const inspector = (sections?: InspectorSection[], bare = false) => (
    <Inspector
      template={template}
      state={state}
      dispatch={dispatch}
      sections={sections}
      bare={bare}
      brandPanel={imageSlots.length > 0 ? <BrandImages keys={imageSlots} images={project.images ?? {}} onChange={upload.setImage} /> : undefined}
      screenshotPanel={
        <ScreenshotPanel
          screenshots={project.screenshots}
          usingSamples={state.usingSamples}
          selected={slide}
          pending={upload.pending}
          errors={upload.errors}
          notice={upload.notice}
          onSelect={selectSlide}
          onAdd={upload.addFiles}
          onReplace={upload.replaceFile}
          onRemove={upload.remove}
          onMove={(s, offset) => dispatch({ type: "moveScreenshot", id: s.id, offset })}
          onDismissErrors={upload.dismissErrors}
        />
      }
      projectFooter={
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-xs">
          <p className={saveStatus === "error" ? "font-semibold text-[#9E1846]" : "text-muted"}>{SAVE_LABELS[saveStatus]}</p>
          <button
            type="button"
            onClick={() => dispatchHistory({ type: "reset", at: Date.now() })}
            disabled={state.usingSamples && !canUndo(history) && Object.keys(project.variables).length === 0}
            className="shrink-0 rounded-md font-bold text-blue hover:underline disabled:pointer-events-none disabled:opacity-40"
          >
            Start over
          </button>
        </div>
      }
    />
  );

  const preview = (
    <>
      <h1 className="sr-only">Editor: {template.name}</h1>
      <PreviewArea
      template={template}
      project={project}
      slide={slide}
      view={view}
      mode={mode}
      appName={appName}
      onViewChange={setView}
      onSlideChange={selectSlide}
      onAppNameChange={setAppName}
      />
    </>
  );

  const picker = <TemplatePicker project={project} selectedId={template.id} onSelect={selectTemplate} layout={mode === "desktop" ? "list" : "carousel"} />;

  return (
    <div className={`relative flex min-h-dvh flex-col ${mode === "desktop" ? "h-dvh" : ""} ${mode === "mobile" ? "pb-24" : ""}`} {...dropHandlers}>
      <a href="#preview" className="sr-only z-50 rounded-xl bg-ink px-4 py-2 font-bold text-white focus:not-sr-only focus:fixed focus:top-3 focus:left-3">
        Skip to preview
      </a>

      {dragging && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-3 z-50 grid place-items-center rounded-[28px] border-[3px] border-dashed border-blue bg-blue/10 backdrop-blur-[2px]">
          <p className="rounded-2xl border-2 border-ink bg-white px-5 py-3 font-display text-xl font-extrabold shadow-pop">Drop to add screenshots</p>
        </div>
      )}

      <header className="flex items-center justify-between gap-3 border-b border-line bg-white/80 px-4 py-3 backdrop-blur sm:px-6">
        <Logo compact />
        <div className="flex items-center gap-2 sm:gap-3">
          <div role="group" aria-label="History" className="flex items-center gap-1">
            <HistoryButton label="Undo" shortcut="Ctrl+Z" onClick={undo} disabled={!canUndo(history)} path="M9 14 4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
            <HistoryButton label="Redo" shortcut="Ctrl+Shift+Z" onClick={redo} disabled={!canRedo(history)} path="m15 14 5-5-5-5m5 5H9.5a5.5 5.5 0 0 0 0 11H13" />
          </div>
          <p role="status" className="sr-only text-sm font-semibold text-muted tabular-nums md:not-sr-only">
            {exportStatus ?? ""}
          </p>
          <Button variant="secondary" onClick={exportCurrent} disabled={exportStatus !== null} aria-label={`Export slide ${slide + 1} as PNG`}>
            <span aria-hidden="true">
              <span className="hidden sm:inline">Export slide {slide + 1}</span>
              <span className="sm:hidden">PNG</span>
            </span>
          </Button>
          <Button onClick={exportZip} disabled={exportStatus !== null} aria-label={`Download all ${slideCount} slides as ZIP`}>
            <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
              <path d="M8 2v8m0 0-3-3m3 3 3-3M3 13h10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span aria-hidden="true">
              <span className="hidden sm:inline">Download ZIP ({slideCount})</span>
              <span className="sm:hidden">{exportStatus ? "…" : "ZIP"}</span>
            </span>
          </Button>
        </div>
      </header>

      {exportError && (
        <div role="alert" className="flex items-center justify-between gap-3 border-b border-[#F3B5CC] bg-[#FFF0F5] px-4 py-2.5 text-sm font-semibold text-[#9E1846] sm:px-6">
          {exportError}
          <button type="button" onClick={() => setExportError(null)} className="rounded text-xs font-bold underline">
            Dismiss
          </button>
        </div>
      )}

      {mode === "desktop" && (
        <div className="grid min-h-0 flex-1 grid-cols-[288px_minmax(0,1fr)_320px]">
          <div className="relative overflow-y-auto border-r border-line p-5">{picker}</div>
          <main id="preview" tabIndex={-1} className="flex min-h-0 min-w-0 flex-col items-center gap-4 p-6 outline-none">
            {preview}
          </main>
          <aside aria-label="Customize" className="relative overflow-y-auto border-l border-line bg-white/60 p-6">
            {inspector()}
          </aside>
        </div>
      )}

      {mode === "tablet" && (
        <>
          <div className="border-b border-line px-6 pt-5 pb-3">{picker}</div>
          <main id="preview" tabIndex={-1} className="flex flex-col items-center gap-4 px-6 py-6 outline-none">
            {preview}
          </main>
          <section aria-label="Customize" className="grid grid-cols-2 gap-8 border-t border-line bg-white/60 p-6">
            {inspector(["screenshots", "layout"])}
            {inspector(["text", "style"])}
          </section>
        </>
      )}

      {mode === "mobile" && (
        <>
          <main id="preview" tabIndex={-1} className="flex flex-col items-center gap-4 px-4 py-5 outline-none">
            {preview}
          </main>
          <div className="border-t border-line px-4 pt-4">{picker}</div>

          <nav aria-label="Edit" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur">
            <ul className="grid grid-cols-4 gap-1">
              {(Object.keys(SHEET_TITLES) as InspectorSection[]).map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    onClick={(e) => {
                      sheetTrigger.current = e.currentTarget;
                      setSheet(key);
                    }}
                    className="flex w-full flex-col items-center gap-0.5 rounded-xl py-2 text-xs font-bold text-ink hover:bg-canvas"
                  >
                    <SheetIcon section={key} />
                    {key === "screenshots" && !state.usingSamples ? `${SHEET_TITLES[key]} (${project.screenshots.length})` : SHEET_TITLES[key]}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <Sheet
            open={sheet !== null}
            title={sheet === "text" || sheet === "layout" ? `${SHEET_TITLES[sheet]}, slide ${slide + 1}` : sheet ? SHEET_TITLES[sheet] : ""}
            onClose={() => {
              setSheet(null);
              sheetTrigger.current?.focus();
            }}
          >
            {sheet && inspector([sheet], true)}
          </Sheet>
        </>
      )}
    </div>
  );
}

const SAVE_LABELS = {
  idle: "Saved in this browser only",
  saving: "Saving…",
  saved: "Saved in this browser only",
  error: "Not saved: browser storage is full or blocked",
} as const;

function HistoryButton({ label, shortcut, path, ...props }: { label: string; shortcut: string; path: string; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-keyshortcuts={shortcut.replace("Ctrl", "Control")}
      title={`${label} (${shortcut})`}
      className="grid size-9 place-items-center rounded-xl text-ink hover:bg-canvas disabled:pointer-events-none disabled:opacity-35"
      {...props}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </button>
  );
}

function SheetIcon({ section }: { section: InspectorSection }) {
  const paths: Record<InspectorSection, string> = {
    screenshots: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm3 15h4",
    layout: "M4 4h7v9H4zM13 4h7v5h-7zM13 11h7v9h-7zM4 15h7v5H4z",
    text: "M5 6V4h14v2M12 4v16m-3 0h6",
    style: "M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15.5 15H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9zM7.5 11.5h.01M10 7.5h.01M15 7.5h.01",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[section]} />
    </svg>
  );
}
