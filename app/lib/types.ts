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
  uploadedAt: string;
  txHash?: string;
  credentialHash?: string;
}
