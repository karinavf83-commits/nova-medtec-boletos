import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

const ALLOWED_CONTENT_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Public route: store staff upload the nota fiscal without being logged in.
// @vercel/blob's handleUpload mints a short-lived, scoped client token per
// request — the actual file bytes go straight from the browser to Blob
// storage, never through this server.
export async function POST(request: NextRequest) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: 20 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // No server-side bookkeeping needed here — the request record is
        // created afterward by the client with the resulting blob URL.
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error("Blob upload token error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha no upload" },
      { status: 400 }
    );
  }
}
