"use client";

import { useEffect, useState, useRef } from 'react';
import { io, type Socket } from 'socket.io-client';
import uilchilgee from '@/lib/uilchilgee';

interface TuukhEntry {
  tsagiinTuukh?: Array<{
    orsonTsag?: string;
    garsanTsag?: string;
  }>;
  zogsooliinId?: string;
  orsonKhaalga?: string;
  tuluv?: number;
  tulbur?: any[];
}

interface Uilchluulegch {
  _id: string;
  mashiniiDugaar: string;
  baiguullagiinId: string;
  barilgiinId?: string;
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

interface UseParkingSocketOptions {
  baiguullagiinId: string | null | undefined;
  barilgiinId?: string | null | undefined;
  token?: string | null;
  enabled?: boolean;
  maxEntries?: number;
  loadInitialEntries?: boolean;
}

interface UseParkingSocketReturn {
  socket: Socket | null;
  parkingEntries: Uilchluulegch[];
  isConnected: boolean;
  connectionError: Error | null;
  clearEntries: () => void;
  isLoadingInitial: boolean;
}

/**
 * React hook for connecting to parking Socket.IO server and receiving real-time updates
 * @param baiguullagiinId - Organization ID
 * @param barilgiinId - Optional Building ID for building-specific events
 * @param enabled - Whether to enable the socket connection (default: true)
 * @param maxEntries - Maximum number of entries to keep in memory (default: 50)
 */
export function useParkingSocket({
  baiguullagiinId,
  barilgiinId = null,
  token = null,
  enabled = true,
  maxEntries = 50,
  loadInitialEntries = true,
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
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? 'https://amarhome.mn'
      : 'http://103.143.40.46:8084';

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
      console.log('✅ Parking Socket.IO connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Parking Socket.IO disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Parking Socket.IO connection error:', error);
      setConnectionError(error);
      setIsConnected(false);
    });

    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`🔄 Parking Socket.IO reconnecting... Attempt ${attemptNumber}`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('❌ Parking Socket.IO reconnection failed');
      setConnectionError(new Error('Failed to reconnect to parking server'));
    });

    // Listen for new parking entries - Organization level
    const orgEvent = `parkingEntry/${baiguullagiinId}`;
    socketInstance.on(orgEvent, (data: ParkingEntry) => {
      console.log('📥 New parking entry (org level):', data);
      if (data.uilchluulegch) {
        setParkingEntries((prev) => {
          // Check if entry already exists (by _id)
          const existingIndex = prev.findIndex(
            (e) => e._id === data.uilchluulegch!._id
          );
          
          if (existingIndex >= 0) {
            // Update existing entry
            const updated = [...prev];
            updated[existingIndex] = data.uilchluulegch!;
            return updated;
          } else {
            // Add new entry at the beginning
            return [data.uilchluulegch!, ...prev.slice(0, maxEntries - 1)].filter((e): e is Uilchluulegch => e !== undefined);
          }
        });
      }
    });

    // Listen for new parking entries - Building level (if barilgiinId provided)
    if (barilgiinId) {
      const buildingEvent = `parkingEntry/${baiguullagiinId}/${barilgiinId}`;
      socketInstance.on(buildingEvent, (data: ParkingEntry) => {
        console.log('📥 New parking entry (building level):', data);
        if (data.uilchluulegch) {
          setParkingEntries((prev) => {
            // Check if entry already exists (by _id)
            const existingIndex = prev.findIndex(
              (e) => e._id === data.uilchluulegch!._id
            );
            
            if (existingIndex >= 0) {
              // Update existing entry
              const updated = [...prev];
              updated[existingIndex] = data.uilchluulegch!;
              return updated;
            } else {
              // Add new entry at the beginning
              return [data.uilchluulegch!, ...prev.slice(0, maxEntries - 1)].filter((e): e is Uilchluulegch => e !== undefined);
            }
          });
        }
      });
    }

    // Listen for gate open events
    if (baiguullagiinId) {
      // This event pattern might need adjustment based on actual backend implementation
      // Format: zogsoolGarahTulsun{baiguullagiinId}{cameraIP}
      socketInstance.on(`zogsoolGarahTulsun${baiguullagiinId}`, (data: any) => {
        console.log('🚪 Gate open event:', data);
        // Handle gate open events if needed
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
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, [baiguullagiinId, barilgiinId, enabled, maxEntries]);

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

// Export types for use in components
export type { Uilchluulegch, TuukhEntry, ParkingEntry };

export default useParkingSocket;
