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
    const body = await request.json();
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

    // Forward request to streaming proxy service
    // The proxy service should be running (e.g., on port 8083)
    // This service converts RTSP to WebRTC for browser compatibility
    const streamingProxyUrl = 
      process.env.STREAMING_PROXY_URL || 
      process.env.NEXT_PUBLIC_STREAMING_PROXY_URL || 
      "http://127.0.0.1:8083/stream";

    try {
      // Forward POST request to streaming proxy service
      // Send RTSP URL and SDP offer
      const proxyResponse = await fetch(streamingProxyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rtsp: rtspUrl,
          sdp64: sdp64, // Forward the SDP offer if provided
        }),
      });

      if (!proxyResponse.ok) {
        throw new Error(`Proxy service returned ${proxyResponse.status}`);
      }

      // Get response from proxy service
      const contentType = proxyResponse.headers.get("content-type");
      
      // If response is JSON (SDP answer)
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
        
        // If proxy returns SDP as plain text, encode it
        if (proxyData.sdp) {
          return NextResponse.json({
            sdp64: btoa(proxyData.sdp),
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
