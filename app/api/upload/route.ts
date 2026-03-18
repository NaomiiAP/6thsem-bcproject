import { NextRequest } from "next/server";

const PINATA_API_KEY = process.env.PINATA_API_KEY || "";
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY || "";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const walletAddress = formData.get("walletAddress") as string | null;

    if (!file) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
      return Response.json(
        { error: "Pinata API keys not configured" },
        { status: 500 }
      );
    }

    // Build form data for Pinata
    const pinataForm = new FormData();
    pinataForm.append("file", file);

    const metadata = JSON.stringify({
      name: file.name,
      keyvalues: {
        uploadedBy: walletAddress || "unknown",
        uploadedAt: new Date().toISOString(),
      },
    });
    pinataForm.append("pinataMetadata", metadata);

    const options = JSON.stringify({ cidVersion: 1 });
    pinataForm.append("pinataOptions", options);

    // Upload to Pinata
    const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_SECRET_KEY,
      },
      body: pinataForm,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Pinata error:", errText);
      return Response.json(
        { error: "Failed to upload to IPFS" },
        { status: 500 }
      );
    }

    const data = await res.json();

    return Response.json({
      success: true,
      ipfsHash: data.IpfsHash,
      fileName: file.name,
      fileSize: data.PinSize,
      gateway: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    return Response.json(
      { error: error.message || "Upload failed" },
      { status: 500 }
    );
  }
}
