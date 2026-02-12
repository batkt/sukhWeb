"use client";

import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import uilchilgee from '@/lib/uilchilgee';

interface TuukhEntry {
  tsagiinTuukh?: Array<{
    orsonTsag?: string;
    garsanTsag?: string;
    orsonKhaalga?: string;
    garsanKhaalga?: string;
  }>;
  zogsooliinId?: string;
  orsonKhaalga?: string;
  garsanKhaalga?: string;
  tuluv?: number;
  tulbur?: any[];
  turul?: string;
  khungulult?: string;
  tulsunDun?: number;
  ebarimtId?: string;
}

interface Uilchluulegch {
  _id: string;
  mashiniiDugaar: string;
  baiguullagiinId: string;
  barilgiinId?: string;
  turul?: string; // Type (Зочин, Оршин суугч, etc.)
  tuukh?: TuukhEntry[];
  niitDun?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

interface ParkingEntry {
  type?: string;
  uilchluulegch?: Uilchluulegch;
  data?: any;
  mashiniiDugaar?: string;
  CAMERA_IP?: string;
  barilgiinId?: string;
  baiguullagiinId?: string;
  timestamp?: string;
}

export interface CameraInfo {
  cameraIP: string;
  cameraType: "entry" | "exit";
  [key: string]: any;
}

interface UseParkingSocketOptions {
  baiguullagiinId: string | null | undefined;
  barilgiinId?: string | null | undefined;
  token?: string | null;
  enabled?: boolean;
  maxEntries?: number;
  loadInitialEntries?: boolean;
  cameras?: CameraInfo[];
}

interface UseParkingSocketReturn {
  socket: Socket | null;
  parkingEntries: Uilchluulegch[];
  isConnected: boolean;
  connectionError: Error | null;
  clearEntries: () => void;
  isLoadingInitial: boolean;
}

const DEFAULT_CAMERAS: CameraInfo[] = [];

/**
 * React hook for connecting to parking Socket.IO server and receiving real-time updates
 * @param baiguullagiinId - Organization ID
 * @param barilgiinId - Optional Building ID for building-specific events
 * @param enabled - Whether to enable the socket connection (default: true)
 * @param maxEntries - Maximum number of entries to keep in memory (default: 50)
 * @param cameras - List of cameras to subscribe to specific events
 */
export function useParkingSocket({
  baiguullagiinId,
  barilgiinId = null,
  token = null,
  enabled = true,
  maxEntries = 50,
  loadInitialEntries = true,
  cameras = DEFAULT_CAMERAS,
}: UseParkingSocketOptions): UseParkingSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [parkingEntries, setParkingEntries] = useState<Uilchluulegch[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Load initial active entries
  useEffect(() => {
    if (!loadInitialEntries || !baiguullagiinId || !token) {
      return;
    }

    async function loadInitialEntriesData() {
      setIsLoadingInitial(true);
      try {
        const url = '/uilchluulegch/active';
        const params: any = {
          baiguullagiinId: baiguullagiinId,
        };
        if (barilgiinId) {
          params.barilgiinId = barilgiinId;
        }
        
        const response = await uilchilgee(token || undefined).get(url, { params });
        const result = response.data;
        
        if (result.success && result.data) {
          setParkingEntries(result.data || []);
        }
      } catch (error) {
        console.error('Error loading initial parking entries:', error);
      } finally {
        setIsLoadingInitial(false);
      }
    }

    loadInitialEntriesData();
  }, [baiguullagiinId, barilgiinId, token, loadInitialEntries]);

  useEffect(() => {
    // Don't connect if disabled or missing baiguullagiinId
    if (!enabled || !baiguullagiinId) {
      return;
    }

    // Socket.IO server URL - use the parking server
    // User requested to connect to domain
    const socketUrl = 'https://amarhome.mn';


    // Create socket instance
    const socketInstance = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    socketRef.current = socketInstance;

    // Connection events
    socketInstance.on('connect', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Parking Socket.IO connection error:', error);
      setConnectionError(error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', () => {
      // Reconnecting...
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Parking Socket.IO reconnection failed');
      setConnectionError(new Error('Failed to reconnect to parking server'));
    });

    // Helper to update entries
    const updateEntries = (record: Uilchluulegch) => {
        if (!record || !record._id) return;
        setParkingEntries((prev) => {
            const existingIndex = prev.findIndex((e) => e._id === record._id);
            if (existingIndex >= 0) {
              const updated = [...prev];
              updated[existingIndex] = record;
              return updated;
            } else {
              return [record, ...prev.slice(0, maxEntries - 1)].filter((e): e is Uilchluulegch => e !== undefined);
            }
        });
    };

    // Listen for new parking entries - Organization level (Global)
    const orgEvent = `parkingEntry/${baiguullagiinId}`;
    socketInstance.on(orgEvent, (data: ParkingEntry) => {
      if (data.uilchluulegch) {
        updateEntries(data.uilchluulegch);
      }
    });

    // Listen for new parking entries - Building level (if barilgiinId provided)
    if (barilgiinId) {
      const buildingEvent = `parkingEntry/${baiguullagiinId}/${barilgiinId}`;
      socketInstance.on(buildingEvent, (data: ParkingEntry) => {
        if (data.uilchluulegch) {
          updateEntries(data.uilchluulegch);
        }
      });
    }

    // Subscribe to Camera-Specific Events (if cameras provided)
    if (cameras && cameras.length > 0) {
        cameras.forEach(cam => {
            if (cam.cameraType === "entry") {
                const entryEvent = `zogsoolOroh${baiguullagiinId}${cam.cameraIP}`;
                socketInstance.on(entryEvent, (data: any) => {
                    if (data.uilchluulegch) {
                         updateEntries(data.uilchluulegch);
                    }
                });
            } else if (cam.cameraType === "exit") {
                const exitEvent = `zogsoolGarah${baiguullagiinId}${cam.cameraIP}`;
                socketInstance.on(exitEvent, (data: Uilchluulegch) => {
                    updateEntries(data);
                });

                const tulsunEvent = `zogsoolGarahTulsun${baiguullagiinId}${cam.cameraIP}`;
                 socketInstance.on(tulsunEvent, () => {
                    // Camera paid exit event
                });
            }
        });
    }

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.off(orgEvent);
        if (barilgiinId) {
          socketInstance.off(`parkingEntry/${baiguullagiinId}/${barilgiinId}`);
        }
        // Cleanup camera listeners
        if (cameras && cameras.length > 0) {
             cameras.forEach(cam => {
                socketInstance.off(`zogsoolOroh${baiguullagiinId}${cam.cameraIP}`);
                socketInstance.off(`zogsoolGarah${baiguullagiinId}${cam.cameraIP}`);
                socketInstance.off(`zogsoolGarahTulsun${baiguullagiinId}${cam.cameraIP}`);
             });
        }
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, [baiguullagiinId, barilgiinId, enabled, maxEntries, cameras]);

  const clearEntries = () => {
    setParkingEntries([]);
  };

  return {
    socket,
    parkingEntries,
    isConnected,
    connectionError,
    clearEntries,
    isLoadingInitial,
  };
}

export type { Uilchluulegch, TuukhEntry, ParkingEntry };

export default useParkingSocket;
