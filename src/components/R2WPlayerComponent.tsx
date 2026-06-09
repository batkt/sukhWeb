"use client";

import { useEffect, useRef, useMemo } from "react";

// Import R2WPlayer from the minified file
// @ts-ignore - R2WPlayer is exported from the minified file
import { R2WPlayer } from "../../components/streamPlayer/R2Wplayer.min.js";

// Override R2WPlayer.AJAX to intercept and format requests properly for direct streaming proxy connections
if (R2WPlayer && typeof (R2WPlayer as any).AJAX === "function" && !(R2WPlayer as any).__patched) {
  (R2WPlayer as any).__patched = true;
  const originalAJAX = (R2WPlayer as any).AJAX;
  
  (R2WPlayer as any).AJAX = function(...args: any[]) {
    const [_method, urlStr, data, successCb, errorCb, _async, context] = args;
    const isR2WRequest = urlStr && (urlStr.endsWith("/answer") || urlStr.endsWith("/stream"));
    
    if (isR2WRequest) {
      // 1. Rewrite the URL from /answer to /stream for Go RTSPtoWebRTC server
      const newUrl = urlStr.replace(/\/answer$/, "/stream");
      console.log(`[R2WPlayer.AJAX Patch] Intercepting request. URL: ${urlStr} -> ${newUrl}`);
      
      // 2. Format payload as application/x-www-form-urlencoded
      const formData = new URLSearchParams();
      if (data) {
        formData.append("url", data.url || "");
        formData.append("sdp64", data.sdp64 || ""); // backend relay expects 'sdp64'
        formData.append("data", data.sdp64 || "");  // Go RTSPtoWebRTC expects 'data'
      }
      
      fetch(newUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        
        // Parse server's response.
        // Responds with either raw SDP answer (text containing v=0) or JSON { sdp64: "..." }
        let parsedData: any = {};
        try {
          parsedData = JSON.parse(text);
        } catch (e) {
          parsedData = {
            sdp64: text.includes("v=0") || text.includes("m=video") ? btoa(text) : text,
          };
        }
        
        // Standardize and sanitize the parsedData to ensure maximum compatibility
        if (parsedData && typeof parsedData.sdp64 === "string") {
          try {
            const cleanedBase64 = parsedData.sdp64.replace(/\s/g, "");
            const rawSdp = atob(cleanedBase64);
            const cleanBase64 = btoa(rawSdp);
            parsedData.sdp64 = cleanBase64;
            parsedData.data = cleanBase64;
            parsedData.sdp = rawSdp;
          } catch (e) {
            console.error("[R2WPlayer.AJAX Patch] Failed to clean/decode sdp64:", e);
          }
        } else if (parsedData && typeof parsedData.data === "string") {
          try {
            const cleanedBase64 = parsedData.data.replace(/\s/g, "");
            const rawSdp = atob(cleanedBase64);
            const cleanBase64 = btoa(rawSdp);
            parsedData.sdp64 = cleanBase64;
            parsedData.data = cleanBase64;
            parsedData.sdp = rawSdp;
          } catch (e) {
            console.error("[R2WPlayer.AJAX Patch] Failed to clean/decode data:", e);
          }
        }
        
        if (successCb) {
          successCb(parsedData, context);
        }
      })
      .catch((err) => {
        console.error("[R2WPlayer.AJAX Patch] Request failed:", err);
        if (errorCb) {
          errorCb(err.message, context);
        }
      });
      return;
    }
    
    return originalAJAX.apply(this, args);
  };
}

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
  serverPath = "/api/camera",
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
