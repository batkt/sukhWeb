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

// Upper bound on ICE gathering before the offer is sent anyway. Must comfortably
// exceed a TURN Allocate round trip (see the gathering block below for why).
const ICE_GATHER_TIMEOUT_MS = 5000;

// Flip to false in production once you've confirmed the pattern in the console.
const DEBUG = true;

// ICE configuration.
//
// STUN alone is not enough here: viewers on mobile carriers sit behind
// symmetric CGNAT (the mapped port changes on every attempt), and the camera
// side is behind a port-translating NAT too. Symmetric-to-symmetric hole
// punching does not work, so the only direct path that ever succeeds is IPv6 —
// and when IPv6 is unavailable there is nothing to fall back to, which is what
// made the stream appear randomly broken.
//
// TURN fixes that: both peers connect *outbound* to the relay (which always
// works through NAT) and media flows via the relay whenever a direct path
// can't be established.
//
// Credentials are client-visible by nature, so they live in NEXT_PUBLIC_* env
// vars rather than in git. If TURN_URL is unset the player still works over
// STUN/IPv6 exactly as before — it just loses the fallback.
const TURN_URL = process.env.NEXT_PUBLIC_TURN_URL;
const TURN_USER = process.env.NEXT_PUBLIC_TURN_USER;
const TURN_PASS = process.env.NEXT_PUBLIC_TURN_PASS;

const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  ...(TURN_URL && TURN_USER && TURN_PASS
    ? [
        {
          // UDP first (lowest latency), then TCP/TLS for networks that block
          // UDP outright.
          urls: [
            `turn:${TURN_URL}:3478?transport=udp`,
            `turn:${TURN_URL}:3478?transport=tcp`,
            `turns:${TURN_URL}:5349?transport=tcp`,
          ],
          username: TURN_USER,
          credential: TURN_PASS,
        },
      ]
    : []),
];

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
  const visibilityDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (visibilityDebounceRef.current) {
      clearTimeout(visibilityDebounceRef.current);
      visibilityDebounceRef.current = null;
    }
  }, []);

  // Bumped on every teardown. connect() is async, so a connect that started
  // before a prop change can still be mid-await when we tear its peer
  // connection down; comparing against this lets that stale run bail out
  // instead of reporting its (irrelevant) failure over a newer, working one.
  const connectEpochRef = useRef(0);

  const stop = useCallback(() => {
    connectEpochRef.current += 1;
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

    // Claim this run. stop() above bumped the epoch, so any earlier in-flight
    // connect() is now stale and will silently abandon itself.
    const epoch = connectEpochRef.current;
    const isStale = () => !mountedRef.current || connectEpochRef.current !== epoch;

    // Props arrive empty on first paint (both call sites pass `barilgiinId ?? ""`
    // while the building config loads). Bail quietly — the lifecycle effect
    // re-runs and calls us again once the real value lands.
    if (!barilgiinId) {
      log("no barilgiinId yet — waiting for config");
      return;
    }

    setStatus("connecting");
    setErrorMsg("");
    log("connecting…");

    try {
      const pc = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10,
      });
      pcRef.current = pc;

      // Receive-only video track
      pc.addTransceiver("video", { direction: "recvonly" });

      pc.ontrack = (e) => {
        if (!mountedRef.current) return;
        if (e.track.kind === "video" && e.streams[0] && videoRef.current) {
          videoRef.current.srcObject = e.streams[0];
          // Explicitly call play() — autoPlay on a display:none element is
          // unreliable across browsers. This is the authoritative play trigger.
          videoRef.current.play().catch((err) =>
            log("play() error (usually safe to ignore):", err)
          );
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
          // Re-trigger play() in case the stream stalled during the blip.
          if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.play().catch((err) =>
              log("re-play() error:", err)
            );
          }
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

      // Wait for ICE gathering.
      //
      // This flow is NON-trickle: the offer is POSTed once and the answer comes
      // back once, with no channel for late candidates. So every candidate must
      // be gathered BEFORE we send — anything gathered after this point is lost.
      //
      // A TURN relay candidate needs an Allocate round trip plus the 401/nonce
      // retry, which routinely takes longer than a second on mobile. The old 1 s
      // cap therefore captured host/srflx but silently dropped relay, leaving
      // exactly the fallback we added TURN to provide. Relay is gathered last,
      // so once we have one there is nothing slower left to wait for.
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") {
          resolve();
          return;
        }
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          pc.removeEventListener("icegatheringstatechange", onState);
          pc.removeEventListener("icecandidate", onCandidate);
          clearTimeout(timer);
          resolve();
        };
        const onState = () => {
          if (pc.iceGatheringState === "complete") finish();
        };
        const onCandidate = (e: RTCPeerConnectionIceEvent) => {
          if (e.candidate?.candidate.includes(" typ relay")) {
            log("relay candidate gathered");
            finish();
          }
        };
        pc.addEventListener("icegatheringstatechange", onState);
        pc.addEventListener("icecandidate", onCandidate);
        const timer = setTimeout(() => {
          log("ICE gathering timed out — sending offer with what we have");
          finish();
        }, ICE_GATHER_TIMEOUT_MS);
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

      if (isStale()) return;

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

      if (isStale()) return;

      await pc.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: answerSdp })
      );
      log("remote description set — negotiation complete");
    } catch (err: any) {
      // A stale run's failure is meaningless — reporting it would overwrite the
      // status of the newer connect that superseded it (which is what left the
      // video hidden behind a "failed" state on first load until a refresh).
      if (isStale()) {
        log("stale connect attempt aborted:", err?.message ?? String(err));
        return;
      }
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
  // Uses a debounce to avoid rapid isVisible flapping from layout shifts,
  // which was causing spurious stop()+connect() cycles every ~5-6 seconds.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (visibilityDebounceRef.current) {
          clearTimeout(visibilityDebounceRef.current);
        }
        // Delay visibility-false a bit so a quick scroll-off/back-on
        // does not tear down a perfectly good stream.
        const delay = nowVisible ? 0 : 800;
        visibilityDebounceRef.current = setTimeout(() => {
          visibilityDebounceRef.current = null;
          setIsVisible(nowVisible);
        }, delay);
      },
      { threshold: 0.01, rootMargin: "120px" }
    );
    observer.observe(el);

    return () => {
      observer.unobserve(el);
      if (visibilityDebounceRef.current) {
        clearTimeout(visibilityDebounceRef.current);
      }
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
  // NOTE: `isVisible` changes that go false→true will call connect() only if the
  // PC is not already live, avoiding unnecessary reconnects from layout shifts.
  useEffect(() => {
    mountedRef.current = true;
    const shouldStream = isVisible && isTabVisible;

    if (shouldStream) {
      // Only reconnect if there is no active peer connection already running.
      const alreadyConnected =
        pcRef.current !== null &&
        (pcRef.current.connectionState === "connected" ||
          pcRef.current.connectionState === "connecting");
      if (!alreadyConnected) {
        connect();
      }
    } else {
      stop();
    }

    return () => {
      mountedRef.current = false;
      stop();
    };
    // rtspUrl / barilgiinId changes are intentional full-reconnect triggers.
    // isVisible / isTabVisible changes use the guard above to avoid spurious reconnects.
  }, [rtspUrl, barilgiinId, isVisible, isTabVisible, connect, stop]);

  return (
    <div ref={containerRef} className={`relative w-full h-full bg-black ${className ?? ""}`} style={style}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="w-full h-full object-contain"
        style={{
          // Use opacity/visibility instead of display:none.
          // display:none removes the element from layout, which causes browsers
          // to silently reject autoPlay on the stream when the element reappears.
          // opacity+visibility keeps the element in the render tree so play() works.
          opacity: status === "connected" ? 1 : 0,
          visibility: status === "connected" ? "visible" : "hidden",
          position: status === "connected" ? "relative" : "absolute",
        }}
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