import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: POST /api/camera/stream/stream
 * 
 * Alternative endpoint for RTSP streaming
 * Some R2WPlayer configurations may call serverPath + "/stream"
 * 
 * Request Body:
 * {
 *   "rtsp": "rtsp://username:password@ip:port/stream"
 *   OR
 *   "url": "rtsp://username:password@ip:port/stream",
 *   "sdp64": "base64_encoded_sdp_offer" (for WebRTC)
 * }
 * 
 * Response:
 * - If WebRTC: { "sdp64": "base64_encoded_sdp_answer" }
 * - If HLS: { "streamUrl": "http://proxy-server/hls/stream.m3u8" }
 */
export async function POST(request: NextRequest) {
  try {
    // R2WPlayer sends form-encoded data (application/x-www-form-urlencoded)
    const contentType = request.headers.get("content-type") || "";
    let body: any = {};

    // Read the request body as text first (can only read once)
    const rawText = await request.text();

    if (contentType.includes("application/json")) {
      // Parse as JSON
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        throw new Error("Invalid JSON format");
      }
    } else if (contentType.includes("application/x-www-form-urlencoded") || rawText.includes("url=") || rawText.includes("rtsp=")) {
      // Parse as URL-encoded form data
      const params = new URLSearchParams(rawText);
      body = {
        url: params.get("url") || params.get("rtsp") || null,
        rtsp: params.get("rtsp") || params.get("url") || null,
        sdp64: params.get("sdp64") || params.get("sdp") || null,
      };
    } else {
      // Try to parse as JSON as fallback
      try {
        body = JSON.parse(rawText);
      } catch (e) {
        // If JSON parsing fails, try to extract from raw text using regex
        const urlMatch = rawText.match(/(?:url|rtsp)=([^&\s]+)/);
        const sdpMatch = rawText.match(/sdp64=([^&\s]+)/);
        body = {
          url: urlMatch ? decodeURIComponent(urlMatch[1]) : null,
          rtsp: urlMatch ? decodeURIComponent(urlMatch[1]) : null,
          sdp64: sdpMatch ? decodeURIComponent(sdpMatch[1]) : null,
        };
      }
    }

    const { rtsp, url, sdp64 } = body;

    // R2WPlayer may send 'url' instead of 'rtsp'
    const rtspUrl = rtsp || url;


    if (!rtspUrl || typeof rtspUrl !== "string") {
      console.error("Missing RTSP URL in request:", {
        body: body,
        rtsp: rtsp,
        url: url,
        rawText: rawText.substring(0, 500),
      });
      return NextResponse.json(
        { 
          error: "RTSP URL is required in request body",
          receivedBody: body,
          rawText: rawText.substring(0, 200),
        },
        { status: 400 }
      );
    }

    // Validate RTSP URL format
    if (!rtspUrl.startsWith("rtsp://")) {
      return NextResponse.json(
        { 
          error: "Invalid RTSP URL format",
          message: "RTSP URL must start with rtsp://. If the camera only supports HTTP/WebRTC, RTSP may need to be enabled in camera settings.",
          receivedUrl: rtspUrl
        },
        { status: 400 }
      );
    }

    // Forward request to streaming proxy service
    const streamingProxyUrl = 
      process.env.STREAMING_PROXY_URL || 
      process.env.NEXT_PUBLIC_STREAMING_PROXY_URL || 
      "http://127.0.0.1:8083/stream";

    try {
      // The working version sends form-encoded data directly to the proxy
      // R2WPlayer sends: application/x-www-form-urlencoded with url=rtsp://...
      // The proxy expects either form-encoded or JSON with 'url' or 'rtsp' field
      // Try both formats to ensure compatibility
      
      // Format 1: JSON with 'url' field (matching what R2WPlayer sends)
      const proxyRequestBodyJson: { url?: string; rtsp?: string; sdp64?: string } = {
        url: rtspUrl, // Use 'url' field first (what R2WPlayer sends)
        rtsp: rtspUrl, // Also include 'rtsp' for compatibility
      };
      
      // Only add sdp64 if it exists
      if (sdp64) {
        proxyRequestBodyJson.sdp64 = sdp64;
      }

      // Format 2: Form-encoded (matching R2WPlayer's original format)
      const formData = new URLSearchParams();
      formData.append("url", rtspUrl);
      if (sdp64) {
        formData.append("sdp64", sdp64);
      }
      

      // The working version sends form-encoded data directly to the proxy
      // Try form-encoded format first (matching R2WPlayer's original format)
      // If that doesn't work, fall back to JSON
      let proxyResponse: Response;
      let requestBodyString: string;
      let contentTypeUsed: string;
      
      try {
        // Try form-encoded format first (what R2WPlayer sends)
        requestBodyString = formData.toString();
        contentTypeUsed = "application/x-www-form-urlencoded";
        
        proxyResponse = await fetch(streamingProxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": contentTypeUsed,
          },
          body: requestBodyString,
        });
        
        // If form-encoded works, use it
        if (proxyResponse.ok) {
          console.log("Proxy accepted form-encoded format");
        } else {
          throw new Error("Form-encoded failed, trying JSON");
        }
      } catch (formError) {
        // Fall back to JSON format
        console.log("Trying JSON format as fallback");
        requestBodyString = JSON.stringify(proxyRequestBodyJson);
        contentTypeUsed = "application/json";
        
        proxyResponse = await fetch(streamingProxyUrl, {
          method: "POST",
          headers: {
            "Content-Type": contentTypeUsed,
            "Accept": "application/json",
          },
          body: requestBodyString,
        });
      }
      
      if (!proxyResponse.ok) {
        // Try to get error details from the proxy response
        let errorDetails = `Proxy service returned ${proxyResponse.status}`;
        let userFriendlyMessage = "Камер холбогдохгүй байна";
        
        try {
          const errorText = await proxyResponse.text();
          if (errorText) {
            try {
              const errorJson = JSON.parse(errorText);
              errorDetails = errorJson.message || errorJson.error || errorText;
            } catch {
              errorDetails = errorText.substring(0, 200); // Limit error text length
            }
          }
        } catch (e) {
          // If we can't read the error, use the status
          errorDetails = `Proxy service returned ${proxyResponse.status} ${proxyResponse.statusText}`;
        }
        
        // Provide user-friendly error messages based on common errors
        if (errorDetails.includes("refused") || errorDetails.includes("connectex")) {
          userFriendlyMessage = "Камер руу холбогдох боломжгүй. Сүлжээний холболт эсвэл камерын тохиргоог шалгана уу.";
        } else if (errorDetails.includes("Codec Not Found")) {
          userFriendlyMessage = "Камерын кодек олдсонгүй. Камерын тохиргоог шалгана уу.";
        } else if (errorDetails.includes("timeout")) {
          userFriendlyMessage = "Камер руу холбогдох хугацаа дууссан. Камер ажиллаж байгаа эсэхийг шалгана уу.";
        }
        
        console.error("Streaming proxy error:", {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          details: errorDetails,
          rtspUrl: rtspUrl,
        });
        
        // Return error with user-friendly message
        return NextResponse.json(
          {
            error: "Streaming proxy service error",
            message: userFriendlyMessage,
            technicalDetails: errorDetails,
            rtsp: rtspUrl,
          },
          { status: proxyResponse.status }
        );
      }

      // Get response from proxy service
      const contentType = proxyResponse.headers.get("content-type");

      
      // If response is JSON (SDP answer or stream URL)
      if (contentType?.includes("application/json")) {
        const proxyData = await proxyResponse.json();
        
        
        // R2WPlayer expects sdp64 in the response for WebRTC
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
          const sdp64 = typeof proxyData.sdp === 'string' 
            ? btoa(proxyData.sdp) 
            : proxyData.sdp;
          return NextResponse.json({
            sdp64: sdp64,
          }, {
            headers: {
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
              "Access-Control-Allow-Headers": "Content-Type",
            },
          });
        }
        
        // Check if response contains base64 SDP in other fields
        if (proxyData.data || proxyData.answer) {
          const sdpData = proxyData.data || proxyData.answer;
          if (typeof sdpData === 'string') {
            // Check if it's already base64 or needs encoding
            const sdp64 = sdpData.includes('v=0') ? btoa(sdpData) : sdpData;
            return NextResponse.json({
              sdp64: sdp64,
            }, {
              headers: {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
              },
            });
          }
        }
        
        // Return stream URL or other data as-is
        return NextResponse.json(proxyData, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        });
      }
      
      // If response is text/plain, it might be SDP
      if (contentType?.includes("text/plain") || contentType?.includes("text")) {
        const textData = await proxyResponse.text();
        console.log("Proxy text response length:", textData.length);
        
        // Check if it's SDP format
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
      
      // If response is the stream itself
      const streamData = await proxyResponse.arrayBuffer();
      return new NextResponse(streamData, {
        status: 200,
        headers: {
          "Content-Type": contentType || "video/mp4",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (proxyError: any) {
      console.error("Streaming proxy error:", proxyError);
      
      return NextResponse.json(
        {
          error: "Streaming proxy service unavailable",
          message: `Could not connect to streaming proxy at ${streamingProxyUrl}. Please ensure the streaming proxy service is running.`,
          rtsp: rtspUrl,
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
