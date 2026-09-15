"use client";

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { getApiUrl } from "@/lib/uilchilgee";

interface SocketProviderProps {
  children: ReactNode;
  socket?: Socket | null;
}

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ socket: initialSocket = null, children }: SocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(initialSocket);

  useEffect(() => {
    if (initialSocket) return; // socket provided from outside (e.g. tests / custom)
    // choose secure websocket on HTTPS pages (wss), otherwise ws for local dev
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const apiUrl = getApiUrl();
    const defaultSocketBase = apiUrl.endsWith("/api/")
      ? apiUrl.slice(0, -5)
      : apiUrl.endsWith("/api")
      ? apiUrl.slice(0, -4)
      : apiUrl;

    const url =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (defaultSocketBase.startsWith("http")
        ? defaultSocketBase
        : `${protocol}://${window.location.host}`);

    const s = io(url, {
      path: "/socket.io",
      transports: ["websocket"],
      secure: window.location.protocol === "https:",
      withCredentials: true,
    });

    setSocket(s);

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [initialSocket]);

  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

export default SocketContext;
