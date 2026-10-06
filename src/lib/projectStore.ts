import type { Project, Screenshot } from "@/types/project";
import type { SavedSession } from "@/components/editor/history";

/*
 * Autosave: the current project lives in this browser's IndexedDB, never on a server.
 * Images are stored once per screenshot id (as blobs); the session record only references them.
 */

const DB_NAME = "storepresence";
const DB_VERSION = 1;
const IMAGES = "images";
const SESSIONS = "sessions";
const CURRENT = "current";
const BACKDROPS: string[] = ["mesh", "grid", "dots"];
/** Bump when the saved shape changes incompatibly; older saves are ignored. */
const FORMAT = 1;

type StoredImage = { id: string; name: string; width: number; height: number; blob: Blob };
type ImageRef = Omit<StoredImage, "blob">;
type StoredProject = Omit<Project, "screenshots" | "images"> & {
  screenshots: ImageRef[];
  images?: Partial<Record<keyof NonNullable<Project["images"]>, ImageRef>>;
};
type StoredSession = { format: number; savedAt: number; slide: number; usingSamples: boolean; project: StoredProject };

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(IMAGES, { keyPath: "id" });
      request.result.createObjectStore(SESSIONS);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  // A failed open (private mode, blocked storage) may succeed later; don't cache the failure.
  dbPromise.catch(() => (dbPromise = null));
  return dbPromise;
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error);
  });
}

function result<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const toRef = ({ id, name, width, height }: Screenshot): ImageRef => ({ id, name, width, height });

/** Uploaded images in a session. Samples are generated per visit and never stored. */
export function sessionImages(session: SavedSession): Screenshot[] {
  const { project, usingSamples } = session;
  return [...(usingSamples ? [] : project.screenshots), ...Object.values(project.images ?? {})];
}

/** Converts a session to its stored form. Pure; exported for tests. */
export function toStored(session: SavedSession, savedAt: number): StoredSession {
  const { project, slide, usingSamples } = session;
  const images = Object.fromEntries(Object.entries(project.images ?? {}).map(([key, image]) => [key, toRef(image)]));
  return {
    format: FORMAT,
    savedAt,
    slide,
    usingSamples,
    project: { ...project, screenshots: usingSamples ? [] : project.screenshots.map(toRef), images },
  };
}

/** Rebuilds a session, creating object URLs for stored images. Returns null for unusable saves. */
export function fromStored(stored: StoredSession, urlFor: (id: string) => string | undefined): SavedSession | null {
  if (stored?.format !== FORMAT) return null;
  const revive = (ref: ImageRef): Screenshot | null => {
    const url = urlFor(ref.id);
    return url ? { ...ref, url } : null;
  };
  const screenshots = stored.project.screenshots.map(revive).filter((s): s is Screenshot => s !== null);
  const images = Object.fromEntries(
    Object.entries(stored.project.images ?? {}).flatMap(([key, ref]) => {
      const image = ref && revive(ref);
      return image ? [[key, image]] : [];
    }),
  );
  // If every upload went missing, fall back to the samples rather than an empty set.
  const usingSamples = stored.usingSamples || screenshots.length === 0;
  // Saves from older versions may use a backdrop kind that no longer exists.
  const backdrop = stored.project.backdrop && BACKDROPS.includes(stored.project.backdrop.kind) ? stored.project.backdrop : undefined;
  return {
    slide: stored.slide,
    usingSamples,
    project: { ...stored.project, backdrop, screenshots: usingSamples ? [] : screenshots, images },
  };
}

/** Image id → object URL already stored, so bytes are written once (a replaced screenshot keeps its id but gets a new URL). */
const written = new Map<string, string>();

/** Saves the session. Image blobs are read from their object URLs the first time they are seen. */
export async function saveSession(session: SavedSession): Promise<void> {
  const images = sessionImages(session);
  const fresh = images.filter((s) => written.get(s.id) !== s.url);
  // Read blobs before opening the transaction: IndexedDB transactions close across awaits.
  const blobs = await Promise.all(fresh.map(async (s) => ({ ...toRef(s), blob: await (await fetch(s.url)).blob() })));

  const db = await open();
  const tx = db.transaction([IMAGES, SESSIONS], "readwrite");
  const store = tx.objectStore(IMAGES);
  blobs.forEach((image) => store.put(image satisfies StoredImage));
  tx.objectStore(SESSIONS).put(toStored(session, Date.now()), CURRENT);
  // Drop images the project no longer uses.
  const keep = new Set(images.map((s) => s.id));
  store.getAllKeys().onsuccess = (e) => {
    for (const key of (e.target as IDBRequest<IDBValidKey[]>).result) if (!keep.has(String(key))) {
      store.delete(key);
      written.delete(String(key));
    }
  };
  await done(tx);
  fresh.forEach((s) => written.set(s.id, s.url));
}

/** Loads the saved session, or null when there is none (or storage is unavailable). */
export async function loadSession(): Promise<SavedSession | null> {
  const db = await open();
  const tx = db.transaction([IMAGES, SESSIONS], "readonly");
  const [stored, images] = await Promise.all([
    result(tx.objectStore(SESSIONS).get(CURRENT) as IDBRequest<StoredSession | undefined>),
    result(tx.objectStore(IMAGES).getAll() as IDBRequest<StoredImage[]>),
  ]);
  if (!stored) return null;
  const urls = new Map(images.map((image) => [image.id, URL.createObjectURL(image.blob)]));
  const session = fromStored(stored, (id) => urls.get(id));
  // Free URLs the session didn't use (stale images).
  const used = new Set(session ? sessionImages(session).map((s) => s.url) : []);
  urls.forEach((url, id) => (used.has(url) ? written.set(id, url) : URL.revokeObjectURL(url)));
  return session;
}
