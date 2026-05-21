export interface CredentialData {
  hash: string;
  subject: string;
  issuer: string;
  credentialType: string;
  issuedAt: number;
  revoked: boolean;
}

export interface DIDProfile {
  address: string;
  did: string;
  name: string;
  isRegistered: boolean;
}

export interface UploadedDocument {
  title?: string;
  fileName: string;
  ipfsHash: string;
  gateway: string;
  mimeType?: string;
  uploadedAt: string;
  fileSize?: number;
  txHash?: string;
  credentialHash?: string;
}
