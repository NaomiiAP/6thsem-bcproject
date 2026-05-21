'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Award, CheckCircle, ExternalLink, Copy, Loader2, XCircle, RefreshCw } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useTrustID } from '../hooks/useTrustID';
import { shortenAddress, CONTRACT_ADDRESS } from '../lib/contract';
import type { CredentialData } from '../lib/types';

type AppError = Error & {
  reason?: string;
};

function getErrorMessage(error: unknown): string {
  const appError = error as AppError;
  return appError?.reason || appError?.message || 'Transaction failed';
}

export default function Issuer() {
  const [activePortal, setActivePortal] = useState<'issued' | 'issuance'>('issuance');
  const { account, isConnected } = useWallet();
  const { issueCredential, getIssuedCredentials, revokeCredential, getProfile } = useTrustID();

  // Issuance form
  const [subjectDID, setSubjectDID] = useState('');
  const [credType, setCredType] = useState('University Degree');
  const [metadata, setMetadata] = useState('{ "degree": "B.Tech CSE", "grade": "A+", "year": 2024 }');
  const [issueStatus, setIssueStatus] = useState<'idle' | 'signing' | 'confirming' | 'success'>('idle');
  const [txHash, setTxHash] = useState('');
  const [issuedHash, setIssuedHash] = useState('');
  const [error, setError] = useState('');

  // Issued credentials list
  const [issuedCreds, setIssuedCreds] = useState<(CredentialData & { subjectName?: string })[]>([]);
  const [loadingCreds, setLoadingCreds] = useState(false);
  const [revokingHash, setRevokingHash] = useState<string | null>(null);

  const loadCreds = useCallback(async () => {
    if (!account) return;
    setLoadingCreds(true);
    try {
      const creds = await getIssuedCredentials();
      // Resolve subject names
      const credsWithNames = await Promise.all(
        creds.map(async (c) => {
          try {
            const profile = await getProfile(c.subject);
            return { ...c, subjectName: profile.name || undefined };
          } catch {
            return c;
          }
        })
      );
      setIssuedCreds(credsWithNames);
    } catch (err) {
      console.error('Failed to load issued credentials:', err);
    } finally {
      setLoadingCreds(false);
    }
  }, [account, getIssuedCredentials, getProfile]);

  useEffect(() => {
    if (!account || activePortal !== 'issued') return;
    void loadCreds();
  }, [account, activePortal, loadCreds]);

  const handleIssue = async () => {
    setError('');
    setIssuedHash('');
    let subjectAddr = subjectDID.trim();
    if (subjectAddr.startsWith('did:ethr:')) {
      subjectAddr = subjectAddr.replace('did:ethr:', '');
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(subjectAddr)) {
      setError('Invalid address. Enter a valid Ethereum address or DID.');
      return;
    }

    setIssueStatus('signing');
    try {
      const result = await issueCredential(subjectAddr, credType, metadata);
      setTxHash(result.tx.hash);
      setIssuedHash(result.hash);
      setIssueStatus('success');
    } catch (err: unknown) {
      console.error('Issue failed:', err);
      setError(getErrorMessage(err));
      setIssueStatus('idle');
    }
  };

  const handleRevoke = async (hash: string) => {
    setRevokingHash(hash);
    try {
      await revokeCredential(hash);
      // Update local state
      setIssuedCreds(prev => prev.map(c => c.hash === hash ? { ...c, revoked: true } : c));
    } catch (err: unknown) {
      alert(getErrorMessage(err) || 'Revoke failed');
    } finally {
      setRevokingHash(null);
    }
  };

  const resetForm = () => {
    setIssueStatus('idle');
    setTxHash('');
    setIssuedHash('');
    setSubjectDID('');
    setMetadata('{ "degree": "B.Tech CSE", "grade": "A+", "year": 2024 }');
    setError('');
  };

  const copyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => {
        window.prompt('Copy this value:', text);
      });
    } else {
      window.prompt('Copy this value:', text);
    }
  };

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
        <Navbar />
        <div className="max-w-6xl mx-auto text-center pt-20">
          <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-white/50">Connect as an Issuer to issue verifiable credentials.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <Navbar />

      <div className="max-w-6xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold mb-2 uppercase tracking-tighter">Issuer <span className="gradient-text">Portal</span></h1>
            <p className="text-white/50">Authorize and issue verifiable credentials to users.</p>
          </div>
          <div className="flex gap-4 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              onClick={() => setActivePortal('issuance')}
              className={`px-6 py-3 rounded-xl transition-all font-bold ${activePortal === 'issuance' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white'}`}
            >
              Issue New
            </button>
            <button
              onClick={() => setActivePortal('issued')}
              className={`px-6 py-3 rounded-xl transition-all font-bold ${activePortal === 'issued' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white'}`}
            >
              Issued ({issuedCreds.length})
            </button>
          </div>
        </header>

        {/* ISSUE NEW TAB */}
        {activePortal === 'issuance' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {issueStatus === 'success' ? (
              <div className="max-w-3xl mx-auto glass-card border-green-500/30 bg-green-500/5">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-500/30">
                    <CheckCircle className="text-green-400" size={40} />
                  </div>
                  <h2 className="text-3xl font-black mb-2">Credential Issued!</h2>
                  <p className="text-white/40">Successfully stored on Sepolia testnet.</p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Credential Hash</p>
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-mono text-white/60 flex-1 break-all">{issuedHash}</p>
                      <button onClick={() => copyToClipboard(issuedHash)} className="p-2 hover:bg-white/5 rounded-lg border border-white/5">
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Transaction</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-indigo-400 hover:underline flex items-center gap-2"
                    >
                      {txHash.slice(0, 20)}...{txHash.slice(-8)} <ExternalLink size={14} />
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Type</p>
                      <p className="font-bold">{credType}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Subject</p>
                      <p className="font-mono text-sm">{shortenAddress(subjectDID.replace('did:ethr:', ''))}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={resetForm} className="glow-button flex-1 justify-center py-4">
                    Issue Another
                  </button>
                  <button
                    onClick={() => { resetForm(); setActivePortal('issued'); }}
                    className="glass-card flex-1 justify-center py-4 border-white/5 hover:bg-white/5 font-bold transition-all flex items-center gap-2"
                  >
                    View All Issued
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto glass-card border-indigo-500/20">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                    <Award className="text-indigo-400" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Credential Configuration</h2>
                    <p className="text-white/30 text-sm">Fill in details to issue a verifiable credential on Sepolia.</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-white/40 font-bold uppercase tracking-widest">User DID / Address</label>
                      <input
                        type="text"
                        placeholder="did:ethr:0x... or 0x..."
                        value={subjectDID}
                        onChange={(e) => setSubjectDID(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-white/40 font-bold uppercase tracking-widest">Credential Type</label>
                      <select
                        value={credType}
                        onChange={(e) => setCredType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer"
                      >
                        <option>University Degree</option>
                        <option>Identity Card</option>
                        <option>Aadhaar Card</option>
                        <option>Driver License</option>
                        <option>Health Certificate</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-white/40 font-bold uppercase tracking-widest">Metadata JSON (signed data)</label>
                    <textarea
                      rows={4}
                      value={metadata}
                      onChange={(e) => setMetadata(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono text-xs"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                      {error}
                    </div>
                  )}

                  <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-sm font-bold text-white/40">
                      <ShieldCheck className="text-green-400" size={20} />
                      Sepolia Testnet
                    </div>
                    <button
                      onClick={handleIssue}
                      disabled={issueStatus !== 'idle'}
                      className={`glow-button !py-4 !px-12 ${issueStatus !== 'idle' ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      {issueStatus === 'signing' ? (
                        <><Loader2 size={18} className="animate-spin" /> Awaiting Signature...</>
                      ) : (
                        'Issue Credential'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ISSUED CREDENTIALS TAB */}
        {activePortal === 'issued' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <p className="text-white/30 text-sm">{issuedCreds.length} credential{issuedCreds.length !== 1 ? 's' : ''} issued</p>
              <button onClick={loadCreds} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
                <RefreshCw size={14} className={loadingCreds ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {loadingCreds ? (
              <div className="text-center py-12 text-white/40">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                Loading issued credentials...
              </div>
            ) : issuedCreds.length === 0 ? (
              <div className="glass-card text-center py-12">
                <Award className="text-white/10 mx-auto mb-4" size={48} />
                <p className="text-white/40 text-lg">No credentials issued yet.</p>
                <p className="text-white/20 mt-2">Switch to &quot;Issue New&quot; to create verifiable credentials.</p>
              </div>
            ) : (
              <div className="grid gap-5">
                {issuedCreds.map(cred => {
                  const isRevoking = revokingHash === cred.hash;
                  return (
                    <div key={cred.hash} className="glass-card group hover:border-indigo-500/40">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-4">
                        <div className="flex items-center gap-5">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20">
                            <Award size={24} />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold">{cred.credentialType}</h3>
                            <p className="text-white/40 text-sm">
                              To: <span className="text-white/60 font-bold">{cred.subjectName || shortenAddress(cred.subject)}</span>
                              {' '}&bull; {formatDateTime(cred.issuedAt)}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 shrink-0 ${cred.revoked ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                          {cred.revoked ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
                          {cred.revoked ? 'Revoked' : 'Active'}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="bg-white/5 rounded-xl p-3 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Credential Hash</p>
                          <p className="text-xs font-mono text-white/40 break-all">{cred.hash}</p>
                        </div>
                        <div>
                          <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Subject Address</p>
                          <p className="text-xs font-mono text-white/40">{cred.subject}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => copyToClipboard(cred.hash)}
                          className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <Copy size={14} /> Copy Hash
                        </button>
                        <a
                          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                        >
                          <ExternalLink size={14} /> Etherscan
                        </a>
                        {!cred.revoked && (
                          <button
                            onClick={() => handleRevoke(cred.hash)}
                            disabled={isRevoking}
                            className="px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 disabled:opacity-50 ml-auto"
                          >
                            {isRevoking ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            {isRevoking ? 'Revoking...' : 'Revoke'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </main>
  );
}
