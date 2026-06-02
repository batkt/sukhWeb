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

export default function WebRTCVideoPlayer({
  rtspUrl,
  barilgiinId,
  token,
  className,
  style,
}: WebRTCVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<Status>("connecting");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);

  const stop = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const connect = useCallback(async () => {
    if (!mountedRef.current) return;
    stop();
    if (!barilgiinId) return;

    setStatus("connecting");
    setErrorMsg("");

    try {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
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
        }
      };

      pc.onconnectionstatechange = () => {
        if (!mountedRef.current) return;
        const state = pc.connectionState;
        if (state === "failed" || state === "disconnected") {
          scheduleRetry();
        }
      };

      // Create offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      // Wait for ICE gathering (max 1 s)
      await new Promise<void>((resolve) => {
        if (pc.iceGatheringState === "complete") { resolve(); return; }
        const check = () => {
          if (pc.iceGatheringState === "complete") { resolve(); }
        };
        pc.addEventListener("icegatheringstatechange", check);
        setTimeout(resolve, 1000);
      });

      const finalOffer = pc.localDescription!;
      const sdp64 = btoa(unescape(encodeURIComponent(finalOffer.sdp)));

      const apiBase = getApiUrl().replace(/\/$/, "");
      const signalingUrl = `${apiBase}/camera/stream/${barilgiinId}/stream`;

      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(signalingUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({ sdp64, rtsp: rtspUrl, url: rtspUrl }),
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

      await pc.setRemoteDescription(new RTCSessionDescription({ type: "answer", sdp: answerSdp }));
    } catch (err: any) {
      if (!mountedRef.current) return;
      const msg = err?.message ?? String(err);
      setErrorMsg(msg);
      setStatus("failed");
      scheduleRetry();
    }
  }, [rtspUrl, barilgiinId, token, stop]);

  const scheduleRetry = useCallback(() => {
    if (!mountedRef.current) return;
    retryCountRef.current += 1;
    const delay = Math.min(3000 * retryCountRef.current, 15000);
    setStatus("retrying");
    retryTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [rtspUrl, barilgiinId]);

  return (
    <div className={`relative w-full h-full bg-black ${className ?? ""}`} style={style}>
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
                className="mt-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] transition-colors"
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
