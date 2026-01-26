"use client";

import { useEffect, useRef, useMemo } from "react";

// Import R2WPlayer from the minified file
// @ts-ignore - R2WPlayer is exported from the minified file
import { R2WPlayer } from "../../components/streamPlayer/R2Wplayer.min.js";

interface R2WPlayerComponentProps {
  Camer: string; // Camera IP
  PORT: number | string; // Camera port
  USER?: string; // Username
  PASSWD?: string; // Password
  ROOT?: string; // Stream path (e.g., "live", "stream")
  serverPath?: string; // Backend server path for WebRTC (default: /api/camera/stream)
  containerId?: string; // Optional container ID
  style?: React.CSSProperties; // Optional style
  onError?: (error: any) => void; // Error callback
  onConnectionStateChange?: (state: string) => void; // Connection state callback
}

export default function R2WPlayerComponent({
  Camer,
  PORT,
  USER,
  PASSWD,
  ROOT = "stream",
  serverPath = "/api/camera/stream",
  containerId,
  style,
  onError,
  onConnectionStateChange,
}: R2WPlayerComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);

  // Memoize style object to prevent unnecessary re-renders
  const memoizedStyle = useMemo(() => ({
    width: "100%",
    height: "100%",
    objectFit: "contain",
    transform: "translateZ(0)",
    willChange: "transform",
    ...style,
  }), [style]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Generate RTSP URL
    const rtspUrl =
      USER && PASSWD
        ? `rtsp://${encodeURIComponent(USER)}:${encodeURIComponent(PASSWD)}@${Camer}:${PORT}/${ROOT}`
        : `rtsp://${Camer}:${PORT}/${ROOT}`;

    // Generate unique container ID if not provided (only once)
    const uniqueContainerId =
      containerId || `r2w-player-${Camer}-${PORT}`;
    
    // Ensure container has the ID
    if (!containerRef.current.id) {
      containerRef.current.id = uniqueContainerId;
    }

    // Skip if player already exists for this container
    if (playerRef.current) {
      // Only update if RTSP URL changed
      const currentRtspUrl = (playerRef.current as any).rtspUrl;
      if (currentRtspUrl === rtspUrl) {
        return; // No changes needed
      }
      // Destroy existing player if URL changed
      try {
        if (typeof (playerRef.current as any).destroy === "function") {
          (playerRef.current as any).destroy();
        }
      } catch (err) {
        console.error("Error destroying existing R2WPlayer:", err);
      }
      playerRef.current = null;
    }

    try {
      // Create R2WPlayer instance with performance optimizations
      // Based on the R2WPlayer code, it accepts an options object with:
      // - containerId: string
      // - serverPath: string (for WebRTC backend)
      // - style: object (CSS styles)
      // - logEnabled: boolean
      const player = new (R2WPlayer as any)({
        containerId: containerRef.current.id,
        serverPath: serverPath,
        style: memoizedStyle,
        logEnabled: process.env.NODE_ENV === "development",
        // Performance options if supported
        muted: true,
        autoplay: true,
        playsinline: true,
      });

      // Set RTSP URL property
      (player as any).rtspUrl = rtspUrl;

      // Set up connection state change handler if provided
      if (onConnectionStateChange && (player as any).connection) {
        (player as any).onconnectionstatechange = (state: string) => {
          onConnectionStateChange(state);
        };
      }

      // Initialize the player (creates video element)
      if (typeof (player as any).init === "function") {
        (player as any).init();
      }

      // Optimize video element after initialization with multiple attempts
      const optimizeVideo = (attempts = 0) => {
        if (containerRef.current) {
          const videoElement = containerRef.current.querySelector('video') as HTMLVideoElement;
          if (videoElement) {
            // Performance optimizations for video element
            videoElement.setAttribute('playsinline', 'true');
            videoElement.setAttribute('webkit-playsinline', 'true');
            videoElement.setAttribute('x5-playsinline', 'true');
            videoElement.setAttribute('x5-video-player-type', 'h5');
            videoElement.setAttribute('x5-video-player-fullscreen', 'true');
            videoElement.setAttribute('x5-video-orientation', 'portraint');
            videoElement.muted = true;
            videoElement.autoplay = true;
            videoElement.playsInline = true;
            
            // CSS optimizations for smooth playback
            videoElement.style.transform = 'translateZ(0)';
            videoElement.style.willChange = 'transform';
            videoElement.style.backfaceVisibility = 'hidden';
            videoElement.style.perspective = '1000px';
            videoElement.style.contain = 'layout style paint';
            videoElement.style.isolation = 'isolate';
            
            // Buffer optimizations
            try {
              videoElement.preload = 'auto';
            } catch (e) {
              // Ignore if not supported
            }
            
            // Force hardware acceleration
            (videoElement.style as any).webkitTransform = 'translateZ(0)';
            (videoElement.style as any).mozTransform = 'translateZ(0)';
            (videoElement.style as any).msTransform = 'translateZ(0)';
            (videoElement.style as any).oTransform = 'translateZ(0)';
            
            return true;
          } else if (attempts < 5) {
            // Retry if video element not found yet
            setTimeout(() => optimizeVideo(attempts + 1), 100);
          }
        }
        return false;
      };
      
      // Try to optimize immediately and with retries
      optimizeVideo();

      // Play the stream
      if (typeof (player as any).play === "function") {
        (player as any).play(rtspUrl);
      }

      playerRef.current = player;

      // Cleanup on unmount
      return () => {
        if (playerRef.current) {
          try {
            if (typeof (playerRef.current as any).destroy === "function") {
              (playerRef.current as any).destroy();
            }
          } catch (err) {
            console.error("Error destroying R2WPlayer:", err);
          }
          playerRef.current = null;
        }
      };
    } catch (error) {
      console.error("Error initializing R2WPlayer:", error);
      if (onError) {
        onError(error);
      }
    }
  }, [Camer, PORT, USER, PASSWD, ROOT, serverPath, containerId, memoizedStyle]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        // Performance optimizations
        transform: "translateZ(0)",
        willChange: "transform",
        backfaceVisibility: "hidden",
        ...style,
      }}
      className="r2w-player-container"
    />
  );
}
