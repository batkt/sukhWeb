import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { io, Socket } from "socket.io-client";
import { t } from "i18next";
import { openErrorOverlay } from "@/components/ui/ErrorOverlay";

export const url = "http://103.143.40.46:8084";

// Socket connection
export const socket = (): Socket =>
  io(url, {
    transports: ["websocket"],
  });

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

// Axios instance for Togloom service
export const togloomUilchilgee = (token?: string): AxiosInstance => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const instance = axios.create({
    baseURL: url,
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
    baseURL: url,
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
    baseURL: url,
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

export const updateBaiguullaga = async (
  token: string | undefined,
  id: string,
  payload: Record<string, any>,
  opts?: { barilgiinId?: string | null }
): Promise<any> => {
  try {
    // Some endpoints require explicit org/building params even for non-GET
    const params: Record<string, any> = {};
    // Prefer the explicit id as baiguullagiinId; fallback to global scope
    params.baiguullagiinId = id || globalBaiguullagiinId || undefined;
    // Allow callers to explicitly target a building; fallback to global scope
    if (typeof opts?.barilgiinId !== "undefined") {
      params.barilgiinId = opts.barilgiinId ?? undefined;
    } else if (globalBarilgiinId) {
      params.barilgiinId = globalBarilgiinId;
    }

    const resp = await uilchilgee(token).put(`/baiguullaga/${id}`, payload, {
      params,
    });
    return resp.data;
  } catch (e) {
    aldaaBarigch(e);
    throw e;
  }
};
