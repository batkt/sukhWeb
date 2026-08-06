"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { getApiUrl } from "@/lib/uilchilgee";

interface WebRTCVideoPlayerProps {
  rtspUrl: string;
  barilgiinId: string;
  token?: string;
  className?: string;
  style?: React.CSSProperties;
}

type Status = "connecting" | "connected" | "failed" | "retrying";

// How long to let a transient "disconnected" state try to recover on its own
// before we tear the connection down and rebuild it. THIS is the fix for the
// random reconnects: "disconnected" is not fatal and usually self-heals.
const DISCONNECT_GRACE_MS = 6000;

// Flip to false in production once you've confirmed the pattern in the console.
const DEBUG = true;

export default function WebRTCVideoPlayer({
  rtspUrl,
  barilgiinId,
  token,
  className,
  style,
}: WebRTCVideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);

  const [status, setStatus] = useState<Status>("connecting");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);

  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  // Keep the latest token / rtsp WITHOUT letting a change to them recreate
  // `connect` and force the lifecycle effect to tear down a live stream.
  // The token only matters for the signaling POST; the media stream does not
  // depend on it once established.
  const tokenRef = useRef(token);
  const rtspRef = useRef(rtspUrl);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { rtspRef.current = rtspUrl; }, [rtspUrl]);

  const log = useCallback(
    (...args: any[]) => {
      if (DEBUG) {
        // eslint-disable-next-line no-console
        console.log(`[webrtc ${barilgiinId}]`, new Date().toISOString(), ...args);
      }
    },
    [barilgiinId]
  );

  const clearTimers = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (disconnectTimerRef.current) {
      clearTimeout(disconnectTimerRef.current);
      disconnectTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearTimers();
    if (pcRef.current) {
      // Detach handlers first so close() doesn't fire a spurious retry.
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [clearTimers]);

  // Lets scheduleRetry call the latest connect without a circular dependency.
  const connectRef = useRef<() => void>(() => { });

  const scheduleRetry = useCallback(() => {
    if (!mountedRef.current) return;
    clearTimers();
    retryCountRef.current += 1;
    const delay = Math.min(3000 * retryCountRef.current, 15000);
    setStatus("retrying");
    log("scheduling retry in", delay, "ms (attempt", retryCountRef.current, ")");
    retryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) connectRef.current();
    }, delay);
  }, [clearTimers, log]);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    stop();
    if (!barilgiinId) return;

    setStatus("connecting");
    setErrorMsg("");
    log("connecting…");

    try {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          // If your cameras sit behind strict/symmetric NAT, add a TURN server.
          // Without a relay, a dropped direct path == a hard failure with no
          // fallback, which shows up as random "failed" reconnects.
          // {
          //   urls: "turn:YOUR_TURN_HOST:3478",
          //   username: "user",
          //   credential: "pass",
          // },
        ],
        iceCandidatePoolSize: 10,
      });
      pcRef.current = pc;

      // Receive-only video track
      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (e) => {
        if (!mountedRef.current) return;
        if (e.track.kind === "video" && e.streams[0] && videoRef.current) {
          videoRef.current.srcObject = e.streams[0];
          setStatus("connected");
          retryCountRef.current = 0;
          log("track received → connected");
        }
      };

      pc.oniceconnectionstatechange = () => {
        log("iceConnectionState =", pc.iceConnectionState);
      };

      pc.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        const state = pc.connectionState;
        log("connectionState =", state);

        if (state === "connected") {
          // Recovered from a transient blip — cancel any pending teardown.
          if (disconnectTimerRef.current) {
            clearTimeout(disconnectTimerRef.current);
            disconnectTimerRef.current = null;
            log("recovered from disconnected — no reconnect needed");
          }
          setStatus("connected");
        } else if (state === "disconnected") {
          // NOT fatal. Give it a grace window to self-heal before rebuilding.
          if (!disconnectTimerRef.current) {
            log("disconnected — waiting", DISCONNECT_GRACE_MS, "ms before deciding");
            disconnectTimerRef.current = setTimeout(() => {
              disconnectTimerRef.current = null;
              if (
                mountedRef.current &&
                pcRef.current?.connectionState !== "connected"
              ) {
                log("still not recovered → reconnecting");
                scheduleRetry();
              }
            }, DISCONNECT_GRACE_MS);
          }
        } else if (state === "failed") {
          // Truly dead — reconnect.
          scheduleRetry();
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering (max 1 s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        const check = () => {
          if (pc.iceGatheringState === "complete") resolve();
        };
        pc.addEventListener("icegatheringstatechange", check);
        setTimeout(resolve, 1000);
      });

      const finalOffer = pc.localDescription!;
      const sdp64 = btoa(unescape(encodeURIComponent(finalOffer.sdp)));

      const apiBase = getApiUrl().replace(/\/$/, "");
      const signalingUrl = `${apiBase}/camera/stream/${barilgiinId}/stream`;

      const headers: HeadersInit = { "Content-Type": "application/json" };
      const tk = tokenRef.current; // read latest token at request time
      if (tk) (headers as Record<string, string>)["Authorization"] = `Bearer ${tk}`;

      const currentRtsp = rtspRef.current;
      const res = await fetch(signalingUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ sdp64, rtsp: currentRtsp, url: currentRtsp }),
      });

      if (!mountedRef.current) return;

      if (!res.ok) {
        const txt = await res.text().catch(() => res.statusText);
        throw new Error(`${res.status}: ${txt}`);
      }

      const data = await res.json();
      let answerSdp: string | null = null;

      if (data.sdp64) {
        answerSdp = decodeURIComponent(escape(atob(data.sdp64)));
      } else if (data.sdp) {
        answerSdp = data.sdp;
      }

      if (!answerSdp) throw new Error("No SDP in response");

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answerSdp })
      );
      log("remote description set — negotiation complete");
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.message ?? String(err);
      log("connect error:", msg);
      setErrorMsg(msg);
      setStatus("failed");
      scheduleRetry();
    }
  }, [barilgiinId, stop, scheduleRetry, log]);

  // Keep connectRef pointing at the latest connect for the retry scheduler.
  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  // Viewport Intersection Observer (Lazy Loading)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      // rootMargin keeps the player from flapping visible/hidden when it sits
      // right at the viewport edge (which would otherwise cause reconnects).
      { threshold: 0.01, rootMargin: "100px" }
    );
    observer.observe(el);

    return () => {
      observer.unobserve(el);
    };
  }, []);

  // Browser Tab Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === "visible");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Manage Stream Lifecycle based on visibility & active states.
  // NOTE: `token` is deliberately NOT a trigger here — it's read via tokenRef,
  // so a token refresh no longer tears down a live stream.
  useEffect(() => {
    mountedRef.current = true;
    const shouldStream = isVisible && isTabVisible;

    if (shouldStream) {
      connect();
    } else {
      stop();
    }

    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [rtspUrl, barilgiinId, isVisible, isTabVisible, connect, stop]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className ?? ""}`} style={style}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
        style={{ display: status === "connected" ? "block" : "none" }}
      />

      {status !== "connected" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white/60">
          {(status === "connecting" || status === "retrying") && (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
              <span className="text-[10px] font-mono">
                {status === "retrying"
                  ? `Дахин холбогдож байна... (${retryCountRef.current})`
                  : "Холбогдож байна..."}
              </span>
            </>
          )}
          {status === "failed" && (
            <>
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span className="text-[9px] font-mono text-center px-2 text-red-400 line-clamp-2">
                {errorMsg || "Холболт амжилтгүй"}
              </span>
              <button
                onClick={connect}
                className="mt-1 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[10px] transition-colors"
              >
                Дахин оролдох
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}