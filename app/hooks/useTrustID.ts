'use client';

import { useCallback } from 'react';
import { useWallet } from '../context/WalletContext';
import { getContract, getReadOnlyContract, computeCredentialHash, formatDID } from '../lib/contract';
import type { CredentialData, DIDProfile } from '../lib/types';

export function useTrustID() {
  const { signer, account } = useWallet();

  const getSignerContract = useCallback(() => {
    if (!signer) throw new Error('Wallet not connected');
    return getContract(signer);
  }, [signer]);

  const registerDID = useCallback(async (name: string) => {
    const contract = getSignerContract();
    const tx = await contract.registerDID(name);
    await tx.wait();
    return tx;
  }, [getSignerContract]);

  const getProfile = useCallback(async (address: string): Promise<DIDProfile> => {
    // Use wallet provider if available (more reliable than public RPC)
    const contract = signer ? getContract(signer) : getReadOnlyContract();
    const [isReg, name] = await Promise.all([
      contract.isRegistered(address),
      contract.getDIDName(address),
    ]);
    return {
      address,
      did: formatDID(address),
      name: name || '',
      isRegistered: isReg,
    };
  }, [signer]);

  const issueCredential = useCallback(async (
    subject: string,
    credentialType: string,
    metadataJSON: string
  ) => {
    const contract = getSignerContract();
    const hash = computeCredentialHash(subject, credentialType, metadataJSON);
    const tx = await contract.issueCredential(subject, credentialType, hash);
    const receipt = await tx.wait();
    return { tx, receipt, hash };
  }, [getSignerContract]);

  const getReaderContract = useCallback(() => {
    return signer ? getContract(signer) : getReadOnlyContract();
  }, [signer]);

  const verifyCredential = useCallback(async (hash: string): Promise<CredentialData & { valid: boolean }> => {
    const contract = getReaderContract();
    const result = await contract.verifyCredential(hash);
    return {
      valid: result.valid,
      hash,
      subject: result.subject,
      issuer: result.issuer,
      credentialType: result.credentialType,
      issuedAt: Number(result.issuedAt),
      revoked: result.revoked,
    };
  }, [getReaderContract]);

  const getMyCredentials = useCallback(async (): Promise<CredentialData[]> => {
    if (!account) return [];
    const contract = getReaderContract();
    const hashes: string[] = await contract.getSubjectCredentials(account);
    const creds = await Promise.all(
      hashes.map(async (hash) => {
        const c = await contract.getCredential(hash);
        return {
          hash,
          subject: c.subject,
          issuer: c.issuer,
          credentialType: c.credentialType,
          issuedAt: Number(c.issuedAt),
          revoked: c.revoked,
        };
      })
    );
    return creds;
  }, [account, getReaderContract]);

  const getIssuedCredentials = useCallback(async (): Promise<CredentialData[]> => {
    if (!account) return [];
    const contract = getReaderContract();
    const hashes: string[] = await contract.getIssuerCredentials(account);
    const creds = await Promise.all(
      hashes.map(async (hash) => {
        const c = await contract.getCredential(hash);
        return {
          hash,
          subject: c.subject,
          issuer: c.issuer,
          credentialType: c.credentialType,
          issuedAt: Number(c.issuedAt),
          revoked: c.revoked,
        };
      })
    );
    return creds;
  }, [account, getReaderContract]);

  const revokeCredential = useCallback(async (hash: string) => {
    const contract = getSignerContract();
    const tx = await contract.revokeCredential(hash);
    await tx.wait();
    return tx;
  }, [getSignerContract]);

  return {
    registerDID,
    getProfile,
    issueCredential,
    verifyCredential,
    getMyCredentials,
    getIssuedCredentials,
    revokeCredential,
  };
}
