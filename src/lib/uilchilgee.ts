import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { io, Socket } from "socket.io-client";
import { t } from "i18next";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

// Use environment variable for API URL
// In production with nginx proxy, use /api (relative path)
// In local development, use full URL
// Priority: env variable > detect production (HTTPS + /api) > default local dev URL
export function getApiUrl(): string {
  // Always use dev API URL on dev branch
  if (
    process.env.NEXT_PUBLIC_BRANCH === "dev" ||
    process.env.VERCEL_GIT_COMMIT_REF === "dev" ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === "dev" ||
    process.env.GITHUB_REF_NAME === "dev" ||
    process.env.BRANCH === "dev"
  ) {
    return "http://103.143.40.46:8084";
  }

  // Otherwise, use env variable if set
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    return "/api";
  }

  if (
    typeof window !== "undefined" &&
    window.location.hostname === "amarhome.mn"
  ) {
    return "https://amarhome.mn/api";
  }

  return "http://103.50.205.80:8084";
}

// Export url for backward compatibility and direct access
// Note: This will use default on server-side, runtime check happens in functions
// Export a runtime-resolved url so server-side code can also pick up branch overrides
export const url = process.env.NEXT_PUBLIC_API_URL || getApiUrl();

// Export for debugging - can be accessed in browser console
if (typeof window !== "undefined") {
  (window as any).__API_URL__ = getApiUrl();
}

// Socket connection
// In production, socket.io goes through nginx proxy at /socket.io
// In development, use the full URL
export const socket = (): Socket => {
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    // Production: use relative path through nginx proxy
    return io({
      path: "/socket.io",
      transports: ["websocket"],
      secure: true,
    });
  } else if (
    typeof window !== "undefined" &&
    window.location.hostname === "amarhome.mn"
  ) {
    // Production domain: use full URL
    return io("https://amarhome.mn", {
      path: "/socket.io",
      transports: ["websocket"],
      secure: true,
    });
  } else {
    // Development: use full URL
    return io(getApiUrl(), {
      transports: ["websocket"],
    });
  }
};

// Helper to call the nekhemjlekhCron service using both domain and IP fallbacks.
// Tries amarhome.mn first, then falls back to the numeric IP if the first
// attempt fails (network error or non-2xx response).
export async function fetchWithDomainFallback(
  path: string,
  options?: RequestInit
): Promise<Response> {
  // Use the api proxy path on the domain so URLs become
  // https://amarhome.mn/api/nekhemjlekhCron/...
  const CRON_DOMAIN = "https://amarhome.mn/api";
  const CRON_IP = "http://103.143.40.46:8084";
  const bases = [CRON_DOMAIN, CRON_IP];

  let lastErr: any = null;
  for (const base of bases) {
    try {
      const res = await fetch(base + path, options as any);
      if (res && res.ok) return res;
      // Keep last response as error if not ok
      lastErr = new Error(`Request failed ${res?.status} ${base}${path}`);
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Both domain and IP requests failed");
}

// Generic error handler
export const aldaaBarigch = (e: any): void => {
  const errorMessage = e?.response?.data?.aldaa;

  if (errorMessage === "jwt expired" || errorMessage === "jwt malformed") {
    window.location.href = "/";
  } else if (errorMessage) {
    // Show warning toast in Mongolian
    openErrorOverlay(t(errorMessage));
  }
};

// Helper function to extract error message from backend response
export const getErrorMessage = (error: any): string => {
  // Try different possible error message fields from backend
  const serverMessage =
    error?.response?.data?.aldaa ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    (typeof error?.response?.data === "string" ? error.response.data : null) ||
    error?.message ||
    "Алдаа гарлаа";

  return String(serverMessage);
};

// Axios instance for Togloom service
export const togloomUilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const instance = axios.create({
    baseURL: getApiUrl(),
    headers,
  });
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      if (config.method?.toLowerCase() === "get") {
        const p: Record<string, any> = { ...(config.params || {}) };
        if (globalBaiguullagiinId && p.baiguullagiinId == null) {
          p.baiguullagiinId = globalBaiguullagiinId;
        }
        if (globalBarilgiinId && p.barilgiinId == null) {
          p.barilgiinId = globalBarilgiinId;
        }
        config.params = p;
      }
    } catch {}
    return config;
  });
  return instance;
};

// Axios instance for Zogsool service
export const zogsoolUilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const instance = axios.create({
    baseURL: getApiUrl(),
    headers,
  });
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      if (config.method?.toLowerCase() === "get") {
        const p: Record<string, any> = { ...(config.params || {}) };
        if (globalBaiguullagiinId && p.baiguullagiinId == null) {
          p.baiguullagiinId = globalBaiguullagiinId;
        }
        if (globalBarilgiinId && p.barilgiinId == null) {
          p.barilgiinId = globalBarilgiinId;
        }
        config.params = p;
      }
    } catch {}
    return config;
  });
  return instance;
};

// Default Axios instance
const uilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const instance = axios.create({
    baseURL: getApiUrl(),
    headers,
  });

  // Attach org/building params automatically for GET requests when available
  instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    try {
      if (config.method?.toLowerCase() === "get") {
        // Initialize params object if missing
        const p: Record<string, any> = { ...(config.params || {}) };

        // Only set if not explicitly provided by the caller
        if (globalBaiguullagiinId && p.baiguullagiinId == null) {
          p.baiguullagiinId = globalBaiguullagiinId;
        }
        // Allow callers to opt-out of auto-injecting barilgiinId via header
        const orgOnly = (config.headers as any)?.["X-Org-Only"] === "1";
        if (!orgOnly) {
          if (globalBarilgiinId && p.barilgiinId == null) {
            p.barilgiinId = globalBarilgiinId;
          }
        }

        config.params = p;
      }
    } catch {}
    return config;
  });

  // Remove offline queueing: if a request fails, just propagate the error
  instance.interceptors.response.use(
    (resp) => resp,
    async (error) => Promise.reject(error)
  );

  return instance;
};

export default uilchilgee;

// Global request scope for org/building used by request interceptor above
let globalBaiguullagiinId: string | null = null;
let globalBarilgiinId: string | null = null;

export const setRequestScope = (opts: {
  baiguullagiinId?: string | null;
  barilgiinId?: string | null;
}) => {
  if (typeof opts.baiguullagiinId !== "undefined") {
    globalBaiguullagiinId = opts.baiguullagiinId ?? null;
  }
  if (typeof opts.barilgiinId !== "undefined") {
    globalBarilgiinId = opts.barilgiinId ?? null;
  }
};

// Small helper to read current in-memory request scope (useful for debugging/tests)
export const getRequestScope = () => ({
  baiguullagiinId: globalBaiguullagiinId,
  barilgiinId: globalBarilgiinId,
});


