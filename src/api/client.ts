import Constants from "expo-constants";
import { getApiBase, isLoopbackApiHost } from "../config";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function extractMessage(data: unknown): string | undefined {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (o.success === false && typeof o.message === "string") return o.message;
  }
  return undefined;
}

async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiFetch(
  path: string,
  init?: RequestInit & { token?: string | null }
): Promise<unknown> {
  const { token, headers: hdrs, ...rest } = init ?? {};
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(hdrs);
  if (!headers.has("Content-Type") && rest.body && typeof rest.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  let res: Response;
  try {
    res = await fetch(url, { ...rest, headers });
  } catch (e) {
    const base = getApiBase();
    const loopbackOnDevice =
      Constants.isDevice && isLoopbackApiHost(base);
    const hint = loopbackOnDevice
      ? " On a real phone, use your computer's LAN IP in EXPO_PUBLIC_API_URL (not 127.0.0.1). Phone and computer must be on the same Wi‑Fi."
      : " Check the backend is running, port is correct, and your firewall allows incoming connections.";
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiError(`${msg}.${hint}`, 0);
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractMessage(data) || res.statusText || "Request failed", res.status);
  }
  return data;
}

/** Multipart POST (e.g. image upload). Do not set Content-Type — boundary is set automatically. */
export async function apiUpload(
  path: string,
  options: { token: string; formData: FormData }
): Promise<unknown> {
  const url = `${getApiBase()}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${options.token}`);
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body: options.formData });
  } catch (e) {
    const base = getApiBase();
    const loopbackOnDevice = Constants.isDevice && isLoopbackApiHost(base);
    const hint = loopbackOnDevice
      ? " On a real phone, use your computer's LAN IP in EXPO_PUBLIC_API_URL (not 127.0.0.1)."
      : " Check the backend is running and reachable.";
    const msg = e instanceof Error ? e.message : "Network request failed";
    throw new ApiError(`${msg}.${hint}`, 0);
  }
  const data = await parseJson(res);
  if (!res.ok) {
    throw new ApiError(extractMessage(data) || res.statusText || "Request failed", res.status);
  }
  return data;
}
