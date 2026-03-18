import { ethers } from "ethers";

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "";

export const CONTRACT_ABI = [
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"hash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"subject","type":"address"},{"indexed":true,"internalType":"address","name":"issuer","type":"address"},{"indexed":false,"internalType":"string","name":"credentialType","type":"string"}],"name":"CredentialIssued","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"hash","type":"bytes32"},{"indexed":true,"internalType":"address","name":"issuer","type":"address"}],"name":"CredentialRevoked","type":"event"},
  {"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"owner","type":"address"},{"indexed":false,"internalType":"string","name":"did","type":"string"},{"indexed":false,"internalType":"string","name":"name","type":"string"}],"name":"DIDRegistered","type":"event"},
  {"inputs":[{"internalType":"address","name":"subject","type":"address"},{"internalType":"string","name":"credentialType","type":"string"},{"internalType":"bytes32","name":"credentialHash","type":"bytes32"}],"name":"issueCredential","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"string","name":"name","type":"string"}],"name":"registerDID","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"credentialHash","type":"bytes32"}],"name":"revokeCredential","outputs":[],"stateMutability":"nonpayable","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"name":"credentials","outputs":[{"internalType":"bytes32","name":"credentialHash","type":"bytes32"},{"internalType":"address","name":"subject","type":"address"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"string","name":"credentialType","type":"string"},{"internalType":"uint256","name":"issuedAt","type":"uint256"},{"internalType":"bool","name":"revoked","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"didNames","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"credentialHash","type":"bytes32"}],"name":"getCredential","outputs":[{"components":[{"internalType":"bytes32","name":"credentialHash","type":"bytes32"},{"internalType":"address","name":"subject","type":"address"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"string","name":"credentialType","type":"string"},{"internalType":"uint256","name":"issuedAt","type":"uint256"},{"internalType":"bool","name":"revoked","type":"bool"}],"internalType":"struct TrustID.Credential","name":"","type":"tuple"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"getDIDName","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"issuer","type":"address"}],"name":"getIssuerCredentials","outputs":[{"internalType":"bytes32[]","name":"","type":"bytes32[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"subject","type":"address"}],"name":"getSubjectCredentials","outputs":[{"internalType":"bytes32[]","name":"","type":"bytes32[]"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"isRegistered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"issuerCredentials","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"registered","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"subjectCredentials","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
  {"inputs":[{"internalType":"bytes32","name":"credentialHash","type":"bytes32"}],"name":"verifyCredential","outputs":[{"internalType":"bool","name":"valid","type":"bool"},{"internalType":"address","name":"subject","type":"address"},{"internalType":"address","name":"issuer","type":"address"},{"internalType":"string","name":"credentialType","type":"string"},{"internalType":"uint256","name":"issuedAt","type":"uint256"},{"internalType":"bool","name":"revoked","type":"bool"}],"stateMutability":"view","type":"function"},
];

export function getContract(signerOrProvider: ethers.Signer | ethers.Provider) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signerOrProvider);
}

export function getReadOnlyContract() {
  const provider = new ethers.JsonRpcProvider(
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || "https://rpc.sepolia.org"
  );
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
}

export function computeCredentialHash(
  subject: string,
  credentialType: string,
  metadataJSON: string
): string {
  return ethers.solidityPackedKeccak256(
    ["address", "string", "string"],
    [subject, credentialType, metadataJSON]
  );
}

export function formatDID(address: string): string {
  return `did:ethr:${address}`;
}

export function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
