import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { Browser, Download, Page } from "@playwright/test";

/** Screenshot shapes from AGENTS.md "Testing": portrait, landscape, very tall, small, plus JPEG. */
export const FIXTURES = [
  { name: "portrait.png", width: 1080, height: 2340, color: "#FF6FAE", type: "image/png" },
  { name: "landscape.webp", width: 2560, height: 1600, color: "#FFD43B", type: "image/webp" },
  { name: "tall-capture.png", width: 1440, height: 6000, color: "#9BE7C4", type: "image/png" },
  { name: "small.png", width: 200, height: 400, color: "#C9B8FF", type: "image/png" },
  { name: "photo.jpg", width: 1242, height: 2688, color: "#7FB2FF", type: "image/jpeg" },
] as const;

/** Draws the fixture images in the browser and writes them to `dir`. Returns their paths. */
export async function createFixtures(browser: Browser, dir: string): Promise<{ images: string[]; unsupported: string }> {
  mkdirSync(dir, { recursive: true });
  const page = await browser.newPage();
  const images: string[] = [];
  for (const f of FIXTURES) {
    const dataUrl = await page.evaluate(({ width, height, color, type, name }) => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#16131F";
      ctx.fillRect(0, 0, width, height * 0.06);
      ctx.font = `bold ${Math.round(Math.min(width, height) / 10)}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(name, width / 2, height / 2);
      return canvas.toDataURL(type, 0.9);
    }, f);
    const file = path.join(dir, f.name);
    writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
    images.push(file);
  }
  await page.close();

  const unsupported = path.join(dir, "anim.gif");
  writeFileSync(unsupported, Buffer.from("GIF89a"));
  return { images, unsupported };
}

/** Width and height from a PNG's IHDR chunk. */
export function pngSize(buffer: Buffer): { width: number; height: number } {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

export async function readDownload(download: Download): Promise<Buffer> {
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks);
}

/** Clicks a header export button and returns the downloaded file. */
export async function exportFrom(page: Page, label: RegExp): Promise<{ name: string; buffer: Buffer }> {
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: label }).click()]);
  return { name: download.suggestedFilename(), buffer: await readDownload(download) };
}

export const yourScreenshots = (page: Page) => page.getByRole("list", { name: "Your screenshots" }).getByRole("listitem");
