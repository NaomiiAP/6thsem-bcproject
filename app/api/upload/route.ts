import { NextRequest } from "next/server";

const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";
const PINATA_JWT = process.env.PINATA_JWT || "";
const PINATA_GATEWAY =
  process.env.PINATA_GATEWAY_URL ||
  process.env.NEXT_PUBLIC_PINATA_GATEWAY_URL ||
  "https://gateway.pinata.cloud/ipfs";

const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

interface PinataLegacyUploadResponse {
  IpfsHash: string;
  PinSize: number;
}

interface PinataV3UploadResponse {
  data: {
    cid: string;
    size: number;
    name: string;
  };
}

interface UploadResult {
  ipfsHash: string;
  fileName: string;
  fileSize: number;
  gateway: string;
  mimeType: string;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Upload failed";
}

function ensurePinataConfigured() {
  if (PINATA_JWT) {
    return "jwt" as const;
  }

  if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    return "legacy" as const;
  }

  throw new Error(
    "Pinata is not configured on the server. Add PINATA_JWT or PINATA_API_KEY/PINATA_SECRET_KEY to .env.local and restart the app."
  );
}

function buildPinataMetadata(file: File, walletAddress: string | null) {
  return {
    name: file.name,
    keyvalues: {
      uploadedBy: walletAddress || "unknown",
      uploadedAt: new Date().toISOString(),
      source: "trustid-demo",
    },
  };
}

async function uploadWithJwt(
  file: File,
  walletAddress: string | null
): Promise<UploadResult> {
  const body = new FormData();
  body.append("network", "public");
  body.append("file", file);
  body.append("name", file.name);
  body.append("keyvalues", JSON.stringify(buildPinataMetadata(file, walletAddress).keyvalues));

  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata V3 upload error:", errorText);
    throw new Error("Pinata upload failed. Check your JWT, quota, and network access.");
  }

  const data: PinataV3UploadResponse = await response.json();

  return {
    ipfsHash: data.data.cid,
    fileName: data.data.name || file.name,
    fileSize: data.data.size,
    gateway: `${PINATA_GATEWAY.replace(/\/+$/, "")}/${data.data.cid}`,
    mimeType: file.type,
  };
}

async function uploadWithLegacyKeys(
  file: File,
  walletAddress: string | null
): Promise<UploadResult> {
  const body = new FormData();
  body.append("file", file);
  body.append("pinataMetadata", JSON.stringify(buildPinataMetadata(file, walletAddress)));
  body.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: {
      pinata_api_key: PINATA_API_KEY,
      pinata_secret_api_key: PINATA_SECRET_KEY,
    },
    body,
    signal: AbortSignal.timeout(30_000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Pinata legacy upload error:", errorText);
    throw new Error("Pinata upload failed. Check your API keys, quota, and network access.");
  }

  const data: PinataLegacyUploadResponse = await response.json();

  return {
    ipfsHash: data.IpfsHash,
    fileName: file.name,
    fileSize: data.PinSize,
    gateway: `${PINATA_GATEWAY.replace(/\/+$/, "")}/${data.IpfsHash}`,
    mimeType: file.type,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const walletAddress = formData.get("walletAddress") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return Response.json(
        { error: "Unsupported file type. Please upload a PDF, JPG, PNG, DOC, or DOCX file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_SIZE_BYTES) {
      return Response.json(
        { error: "File is too large for demo upload. Please keep it under 25 MB." },
        { status: 400 }
      );
    }

    const authMode = ensurePinataConfigured();
    const uploadResult =
      authMode === "jwt"
        ? await uploadWithJwt(file, walletAddress)
        : await uploadWithLegacyKeys(file, walletAddress);

    return Response.json({
      success: true,
      ...uploadResult,
    });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return Response.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
