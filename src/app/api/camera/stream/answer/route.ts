import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: POST /api/camera/stream/answer
 * 
 * Handles WebRTC SDP exchange for RTSP streaming via R2WPlayer
 * R2WPlayer calls serverPath + "/answer" with SDP offer
 * 
 * Request Body (from R2WPlayer):
 * {
 *   "url": "rtsp://username:password@ip:port/stream",
 *   "sdp64": "base64_encoded_sdp_offer"
 * }
 * 
 * Response:
 * {
 *   "sdp64": "base64_encoded_sdp_answer"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};

    const rawText = await request.text();

    if (contentType.includes("application/json")) {
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || rawText.includes("url=") || rawText.includes("rtsp=")) {
      const params = new URLSearchParams(rawText);
      body = {
        url: params.get("url") || params.get("rtsp") || null,
        rtsp: params.get("rtsp") || params.get("url") || null,
        sdp64: params.get("sdp64") || params.get("sdp") || null,
      };
    } else {
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        const urlMatch = rawText.match(/(?:url|rtsp)=([^&\s]+)/);
        const sdpMatch = rawText.match(/sdp64=([^&\s]+)/);
        body = {
          url: urlMatch ? decodeURIComponent(urlMatch[1]) : null,
          rtsp: urlMatch ? decodeURIComponent(urlMatch[1]) : null,
          sdp64: sdpMatch ? decodeURIComponent(sdpMatch[1]) : null,
        };
      }
    }

    const { url: rtsp, sdp64 } = body;

    // R2WPlayer sends 'url' instead of 'rtsp'
    const rtspUrl = rtsp || body.rtsp;

    if (!rtspUrl || typeof rtspUrl !== "string") {
      return NextResponse.json(
        { error: "RTSP URL is required in request body" },
        { status: 400 }
      );
    }

    // Validate RTSP URL format
    if (!rtspUrl.startsWith("rtsp://")) {
      return NextResponse.json(
        { error: "Invalid RTSP URL format" },
        { status: 400 }
      );
    }

    // Forward WebRTC signaling to go2rtc running at 103.236.194.106:8084
    // This runs server-side — no browser CORS restrictions apply
    const GO2RTC_BASE =
      process.env.STREAMING_PROXY_URL ||
      "http://103.236.194.106:8084";

    // Derive stream name from RTSP path for go2rtc (?src= parameter)
    // go2rtc accepts the full RTSP URL as the src parameter
    const streamingProxyUrl = `${GO2RTC_BASE}/api/webrtc?src=${encodeURIComponent(rtspUrl)}`;

    try {
      // Format 1: JSON format with url and sdp64 parameters
      const proxyRequestBodyJson: { url?: string; rtsp?: string; sdp64?: string; data?: string } = {
        url: rtspUrl,
        rtsp: rtspUrl,
      };
      if (sdp64) {
        proxyRequestBodyJson.sdp64 = sdp64;
        proxyRequestBodyJson.data = sdp64;
      }

      // Format 2: Form-encoded format (highly compatible with direct RTSPtoWebRTC Go server)
      const formData = new URLSearchParams();
      formData.append("url", rtspUrl);
      formData.append("rtsp", rtspUrl);
      if (sdp64) {
        formData.append("sdp64", sdp64);
        formData.append("data", sdp64); // RTSPtoWebRTC Go server expects the SDP offer in 'data' parameter
      }

      let proxyResponse: Response;

      // go2rtc WebRTC API: POST /api/webrtc?src=<rtsp_url>
      // Body: the raw SDP offer as plain text (base64-decoded if needed)
      let sdpOffer: string;
      if (sdp64) {
        try {
          sdpOffer = atob(sdp64);
        } catch {
          sdpOffer = sdp64; // already plain text
        }
      } else {
        sdpOffer = "";
      }

      proxyResponse = await fetch(streamingProxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ data: sdp64 || "", url: rtspUrl }).toString(),
      });

      if (!proxyResponse.ok) {
        // Fallback: try sending raw SDP as body
        proxyResponse = await fetch(streamingProxyUrl, {
          method: "POST",
          headers: { "Content-Type": "application/sdp" },
          body: sdpOffer,
        });
      }

      if (!proxyResponse.ok) {
        throw new Error(`Proxy service returned ${proxyResponse.status}`);
      }

      // Get response from proxy service
      const contentType = proxyResponse.headers.get("content-type");
      
      // If response is JSON (SDP answer or stream details)
      if (contentType?.includes("application/json")) {
        const proxyData = await proxyResponse.json();
        
        // R2WPlayer expects sdp64 in the response
        if (proxyData.sdp64) {
          return NextResponse.json({
            sdp64: proxyData.sdp64,
          }, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
        
        // If proxy returns SDP as plain text or in 'data' / 'answer' fields
        if (proxyData.sdp || proxyData.data || proxyData.answer) {
          const sdpData = proxyData.sdp || proxyData.data || proxyData.answer;
          const encodedSdp = typeof sdpData === "string"
            ? (sdpData.includes("v=0") ? btoa(sdpData) : sdpData)
            : sdpData;
          return NextResponse.json({
            sdp64: encodedSdp,
          }, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
        
        // Return as-is if it's already in the right format
        return NextResponse.json(proxyData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }

      // If response is plain text (raw SDP answer)
      if (contentType?.includes("text/plain") || contentType?.includes("text")) {
        const textData = await proxyResponse.text();
        if (textData.includes("v=0") || textData.includes("m=video")) {
          return NextResponse.json({
            sdp64: btoa(textData),
          }, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
      }

      
      // Unexpected response type
      return NextResponse.json(
        { error: "Unexpected response type from proxy service" },
        { status: 500 }
      );
    } catch (proxyError: any) {
      console.error("Streaming proxy error:", proxyError);
      
      // If proxy service is not available, return helpful error
      return NextResponse.json(
        {
          error: "Streaming proxy service unavailable",
          message: `Could not connect to streaming proxy at ${streamingProxyUrl}. Please ensure the streaming proxy service is running.`,
          rtsp: rtspUrl, // Echo back for debugging
          details: proxyError.message,
        },
        { status: 503 }
      );
    }
  } catch (error: any) {
    console.error("Camera stream API error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
