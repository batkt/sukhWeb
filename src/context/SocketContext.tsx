"use client";

import { createContext, ReactNode, useContext } from "react";
import type { Socket } from "socket.io-client";

interface SocketProviderProps {
  children: ReactNode;
  socket: Socket | null;
}

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ socket, children }: SocketProviderProps) {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  );
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}

export default SocketContext;
