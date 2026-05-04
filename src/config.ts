import Constants from "expo-constants";
import { Platform } from "react-native";

export function isLoopbackApiHost(base: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(\/|:|$)/i.test(base.trim());
}

/**
 * Base URL of the Express API (no trailing slash, no `/api` suffix).
 *
 * On a **physical phone**, `127.0.0.1` / `localhost` point to the phone — not your dev machine.
 * Set `EXPO_PUBLIC_API_URL` to your computer's **LAN IP** (same Wi‑Fi), e.g. `http://192.168.1.12:5001`.
 */
export function getApiBase(): string {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  const fromEnv = raw && raw.length > 0 ? raw.replace(/\/$/, "") : undefined;

  const base =
    fromEnv ??
    (Platform.select({
      android: "http://10.0.2.2:5001",
      ios: "http://127.0.0.1:5001",
      default: "http://127.0.0.1:5001",
    }) ?? "http://127.0.0.1:5001");

  if (__DEV__ && Constants.isDevice && isLoopbackApiHost(base)) {
    console.warn(
      "[jewelry-app] API is set to localhost/127.0.0.1 while running on a real device. " +
        "Set EXPO_PUBLIC_API_URL in .env to your computer's IP (e.g. http://192.168.1.5:5001), restart Expo, and ensure the phone is on the same Wi‑Fi."
    );
  }

  return base;
}

/**
 * Resolve image paths from the API to a full URL the app can load.
 *
 * The backend stores paths **relative to the `uploads` disk folder** (e.g.
 * `designer-portfolio/dp-….jpg`) while Express serves them at `/uploads/…`.
 * Some values may use a leading slash (`/designer-portfolio/…`) without the
 * `uploads` segment — those must still map under `/uploads/…`, not the site root.
 * Values may already include `uploads/…` or a full `http(s)` / `data:` URL.
 */
export function mediaUrl(path: string | undefined | null): string | null {
  if (path == null) return null;
  const raw = String(path).trim();
  if (!raw) return null;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^data:/i.test(raw)) return raw;

  const base = getApiBase().replace(/\/$/, "");
  let p = raw.replace(/^\/+/g, "").replace(/\\/g, "/");
  if (/^uploads\//i.test(p)) {
    p = p.replace(/^uploads\//i, "");
  }
  const encodedPath = p
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
  if (!encodedPath) return null;
  return `${base}/uploads/${encodedPath}`;
}

/** Read stored path from a designer portfolio image (handles minor API / JSON shape drift). */
export function portfolioImageRelPath(img: {
  relPath?: string | null;
  rel_path?: string | null;
}): string | null {
  const r = typeof img.relPath === "string" ? img.relPath.trim() : "";
  if (r) return r;
  const snake = img.rel_path;
  if (typeof snake === "string" && snake.trim()) return snake.trim();
  return null;
}

/** Prefer server-provided absolute `url`, else build from `relPath` and API base. */
export function portfolioImageDisplayUri(img: {
  url?: string | null;
  relPath?: string | null;
  rel_path?: string | null;
}): string | null {
  const u = typeof img.url === "string" ? img.url.trim() : "";
  if (u) return u;
  return mediaUrl(portfolioImageRelPath(img));
}
