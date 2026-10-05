export type ExportFile = { name: string; blob: Blob };

/** Bundles files into one ZIP. JSZip loads on demand to keep the editor bundle small. */
export async function buildZip(files: readonly ExportFile[]): Promise<Blob> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, await file.blob.arrayBuffer());
  // PNGs are already compressed; storing is faster and the same size.
  return zip.generateAsync({ type: "blob", compression: "STORE" });
}

/** "Taskly Pro" → "taskly-pro-screenshots.zip"; falls back to "my-app-screenshots.zip". */
export function zipName(appName: string): string {
  const slug = appName
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "my-app"}-screenshots.zip`;
}
