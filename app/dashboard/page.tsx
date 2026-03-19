'use client';

import QRCode from 'react-qr-code';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Shield, Share2, Award, Copy, ExternalLink, X, Loader2, CheckCircle2, Clock, ArrowUpRight, ArrowDownLeft, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useTrustID } from '../hooks/useTrustID';
import { formatDID, shortenAddress, CONTRACT_ADDRESS } from '../lib/contract';
import type { CredentialData, UploadedDocument } from '../lib/types';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'docs' | 'credentials' | 'activity'>('profile');
  const [showQR, setShowQR] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [profileName, setProfileName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [credentials, setCredentials] = useState<CredentialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [verifyingHash, setVerifyingHash] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ hash: string; valid: boolean } | null>(null);

  const { account, isConnected } = useWallet();
  const { getProfile, getMyCredentials, verifyCredential, issueCredential, registerDID } = useTrustID();
  const [registerName, setRegisterName] = useState('');
  const [registeringDID, setRegisteringDID] = useState(false);

  useEffect(() => {
    if (!account) return;
    const load = async (attempt = 1) => {
      setLoading(true);
      try {
        const [profile, creds] = await Promise.all([
          getProfile(account),
          getMyCredentials(),
        ]);
        setProfileName(profile.name);
        setIsRegistered(profile.isRegistered);
        setCredentials(creds);
      } catch (err) {
        console.error(`Failed to load dashboard data (attempt ${attempt}):`, err);
        // Retry once after 2s if first attempt fails (flaky RPC)
        if (attempt < 2) {
          setTimeout(() => load(attempt + 1), 2000);
          return;
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [account, getProfile, getMyCredentials]);

  // Load uploaded docs from localStorage
  useEffect(() => {
    if (!account) return;
    const stored = localStorage.getItem(`trustid_docs_${account}`);
    if (stored) {
      try { setDocuments(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, [account]);

  const [uploadStep, setUploadStep] = useState<'idle' | 'uploading' | 'signing' | 'confirming'>('idle');
  const [docTitle, setDocTitle] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPendingFile(file);
    // Pre-fill title with filename (without extension)
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleFileUpload = async () => {
    if (!pendingFile || !account) return;

    const title = docTitle.trim() || pendingFile.name;

    setUploading(true);
    setUploadError('');
    setUploadStep('uploading');

    try {
      // Step 1: Upload to IPFS via Pinata
      const formData = new FormData();
      formData.append('file', pendingFile);
      formData.append('walletAddress', account);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Upload failed');

      // Step 2: Sign contract transaction to record on-chain
      setUploadStep('signing');
      const metadataJSON = JSON.stringify({
        title,
        fileName: data.fileName,
        ipfsHash: data.ipfsHash,
        fileSize: data.fileSize,
        uploadedAt: new Date().toISOString(),
      });

      const result = await issueCredential(account, 'Document Upload', metadataJSON);

      setUploadStep('confirming');
      await result.receipt;

      const newDoc: UploadedDocument = {
        title,
        fileName: data.fileName,
        ipfsHash: data.ipfsHash,
        gateway: data.gateway,
        uploadedAt: new Date().toISOString(),
        txHash: result.tx.hash,
        credentialHash: result.hash,
      };

      const updated = [...documents, newDoc];
      setDocuments(updated);
      localStorage.setItem(`trustid_docs_${account}`, JSON.stringify(updated));
      setPendingFile(null);
      setDocTitle('');
    } catch (err: any) {
      const reason = err.reason || err.message || '';
      if (err.code === 'ACTION_REJECTED' || err.code === 4001) {
        setUploadError('Transaction rejected — document was uploaded to IPFS but not recorded on-chain.');
      } else if (reason.includes('Not registered')) {
        setIsRegistered(false);
        setUploadError('NOT_REGISTERED');
      } else {
        setUploadError(reason || 'Upload failed');
      }
    } finally {
      setUploading(false);
      setUploadStep('idle');
    }
  };

  const removeDocument = (index: number) => {
    const updated = documents.filter((_, i) => i !== index);
    setDocuments(updated);
    if (account) {
      localStorage.setItem(`trustid_docs_${account}`, JSON.stringify(updated));
    }
  };

  const handleVerifyCredential = async (hash: string) => {
    setVerifyingHash(hash);
    setVerifyResult(null);
    try {
      const result = await verifyCredential(hash);
      setVerifyResult({ hash, valid: result.valid });
    } catch {
      setVerifyResult({ hash, valid: false });
    } finally {
      setVerifyingHash(null);
    }
  };

  const verifiedCount = credentials.filter(c => !c.revoked).length;
  const revokedCount = credentials.filter(c => c.revoked).length;
  const trustScore = credentials.length > 0 ? Math.round((verifiedCount / credentials.length) * 100) : 0;

  const openQR = (value: string) => {
    const origin = window.location.origin;
    let url: string;
    if (value.startsWith('0x') && value.length === 66) {
      url = `${origin}/verifier?hash=${value}`;
    } else {
      url = `${origin}/verifier?did=${encodeURIComponent(value)}`;
    }
    setQrValue(url);
    setShowQR(true);
  };

  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string) => {
    // Try clipboard API, fall through to prompt on any failure
    const markCopied = () => {
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(markCopied).catch(() => {
        window.prompt('Copy this value:', text);
      });
    } else {
      window.prompt('Copy this value:', text);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getStatusInfo = (cred: CredentialData) => {
    if (cred.revoked) return { label: 'Revoked', style: 'bg-red-500/10 text-red-400 border-red-500/30', icon: <ShieldAlert size={16} /> };
    return { label: 'Verified', style: 'bg-green-500/10 text-green-400 border-green-500/30', icon: <ShieldCheck size={16} /> };
  };

  // Build activity timeline from credentials + docs
  const activityItems = [
    ...credentials.map(c => ({
      type: c.revoked ? 'revoked' as const : 'issued' as const,
      title: c.credentialType,
      subtitle: `by ${shortenAddress(c.issuer)}`,
      timestamp: c.issuedAt,
      hash: c.hash,
    })),
    ...documents.map(d => ({
      type: 'uploaded' as const,
      title: d.fileName,
      subtitle: `CID: ${d.ipfsHash.slice(0, 12)}...`,
      timestamp: Math.floor(new Date(d.uploadedAt).getTime() / 1000),
      hash: d.ipfsHash,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  if (!isConnected) {
    return (
      <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
        <Navbar />
        <div className="max-w-6xl mx-auto text-center pt-20">
          <h1 className="text-4xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-white/50">Please connect MetaMask to view your dashboard.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <Navbar />

      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">User <span className="gradient-text">Dashboard</span></h1>
          <p className="text-white/50">Manage your decentralized identity and credentials</p>
        </header>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <div className="glass-card !p-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-1">Credentials</p>
            <p className="text-2xl font-black">{credentials.length}</p>
          </div>
          <div className="glass-card !p-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-1">Verified</p>
            <p className="text-2xl font-black text-green-400">{verifiedCount}</p>
          </div>
          <div className="glass-card !p-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-1">Revoked</p>
            <p className="text-2xl font-black text-red-400">{revokedCount}</p>
          </div>
          <div className="glass-card !p-4 text-center">
            <p className="text-white/30 text-xs uppercase tracking-widest font-bold mb-1">Documents</p>
            <p className="text-2xl font-black text-indigo-400">{documents.length}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          <aside className="space-y-2">
            {(['profile', 'docs', 'credentials', 'activity'] as const).map(tab => {
              const labels = { profile: 'Identity Profile', docs: 'Document Vault', credentials: 'Verifiable Credentials', activity: 'Activity Log' };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === tab ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </aside>

          <div className="space-y-8">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
              >
                {loading ? (
                  <div className="text-center py-12 text-white/40">Loading profile...</div>
                ) : (
                  <>
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20 font-black">
                        {profileName ? profileName.slice(0, 2).toUpperCase() : '??'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{profileName || 'Unregistered'}</h2>
                        <p className="text-white/40 font-mono text-sm mb-2">{account ? formatDID(account) : ''}</p>
                        {isRegistered ? (
                          <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                            Verified Identity
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 border border-yellow-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                            Not Registered
                          </span>
                        )}
                      </div>
                    </div>

                    {!isRegistered && (
                      <div className="mb-8 p-6 bg-yellow-500/5 border border-yellow-500/30 rounded-2xl">
                        <h3 className="text-lg font-bold text-yellow-400 mb-2">Register Your Identity</h3>
                        <p className="text-white/40 text-sm mb-4">Register your DID on-chain to upload documents and receive credentials.</p>
                        <div className="flex gap-3">
                          <input
                            type="text"
                            placeholder="Enter your display name..."
                            value={registerName}
                            onChange={(e) => setRegisterName(e.target.value)}
                            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all"
                          />
                          <button
                            onClick={async () => {
                              if (!registerName.trim()) return;
                              setRegisteringDID(true);
                              try {
                                await registerDID(registerName.trim());
                                setIsRegistered(true);
                                setProfileName(registerName.trim());
                              } catch (err: any) {
                                const reason = err?.reason || err?.message || '';
                                if (reason.includes('Already registered')) {
                                  // Already registered on-chain — just update UI
                                  setIsRegistered(true);
                                  // Reload profile to get the on-chain name
                                  try {
                                    const profile = await getProfile(account!);
                                    setProfileName(profile.name);
                                  } catch { /* ignore */ }
                                } else {
                                  alert(reason || 'Registration failed. Make sure you have Sepolia ETH.');
                                }
                              } finally {
                                setRegisteringDID(false);
                              }
                            }}
                            disabled={registeringDID || !registerName.trim()}
                            className="glow-button !py-3 !px-6 shrink-0 disabled:opacity-50"
                          >
                            {registeringDID ? 'Registering...' : 'Register DID'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid sm:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                      <div>
                        <p className="text-white/30 text-xs mb-1 uppercase tracking-widest font-bold">Total Credentials</p>
                        <p className="text-3xl font-black">{credentials.length}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-xs mb-1 uppercase tracking-widest font-bold">Trust Score</p>
                        <p className="text-3xl font-black text-indigo-400">{trustScore}%</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-xs mb-1 uppercase tracking-widest font-bold">IPFS Documents</p>
                        <p className="text-3xl font-black text-purple-400">{documents.length}</p>
                      </div>
                    </div>

                    <div className="mt-10 flex gap-4">
                      <button onClick={() => openQR(account ? formatDID(account) : '')} className="glow-button flex-1 justify-center py-4">
                        <Share2 size={20} />
                        Share DID via QR
                      </button>
                      <button
                        onClick={() => account && copyToClipboard(formatDID(account))}
                        className="glass-card flex-1 justify-center py-4 border-white/5 hover:bg-white/5 font-bold transition-all flex items-center gap-2 cursor-pointer"
                      >
                        {copied === (account ? formatDID(account) : '') ? <CheckCircle2 size={18} className="text-green-400" /> : <Copy size={18} />}
                        {copied === (account ? formatDID(account) : '') ? 'Copied!' : 'Copy DID'}
                      </button>
                    </div>

                    {/* Quick view of recent credentials on profile */}
                    {credentials.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-white/5">
                        <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Recent Credentials</h3>
                        <div className="space-y-3">
                          {credentials.slice(0, 3).map(cred => {
                            const status = getStatusInfo(cred);
                            return (
                              <div key={cred.hash} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-3">
                                  {status.icon}
                                  <span className="font-medium">{cred.credentialType}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${status.style}`}>{status.label}</span>
                                  <span className="text-xs text-white/20">{formatDate(cred.issuedAt)}</span>
                                </div>
                              </div>
                            );
                          })}
                          {credentials.length > 3 && (
                            <button onClick={() => setActiveTab('credentials')} className="text-indigo-400 text-sm font-bold hover:underline">
                              View all {credentials.length} credentials →
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {/* DOCUMENTS TAB */}
            {activeTab === 'docs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className={`glass-card border-dashed border-indigo-500/40 bg-indigo-500/5 py-8 text-center ${uploading ? 'pointer-events-none opacity-60' : ''}`}>
                  {/* File selector */}
                  <label className="cursor-pointer group block mb-6">
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileSelect}
                      disabled={uploading}
                    />
                    <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      {uploading ? (
                        <Loader2 className="text-indigo-400 animate-spin" size={32} />
                      ) : (
                        <FileUp className="text-indigo-400" size={32} />
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2">
                      {uploadStep === 'uploading' ? 'Uploading to IPFS...' :
                       uploadStep === 'signing' ? 'Sign with MetaMask...' :
                       uploadStep === 'confirming' ? 'Confirming on-chain...' :
                       pendingFile ? pendingFile.name :
                       'Select Document'}
                    </h3>
                    <p className="text-white/40 max-w-sm mx-auto text-sm">
                      {uploadStep === 'signing' ? 'Confirm the transaction in MetaMask to record this document on the blockchain.' :
                       uploadStep === 'confirming' ? 'Waiting for transaction confirmation on Sepolia...' :
                       pendingFile ? 'Click to change file' :
                       'Upload Aadhaar, College ID, or Passport. Files are stored on IPFS and recorded on-chain.'}
                    </p>
                  </label>

                  {/* Title + Upload button — shown after file is selected */}
                  {pendingFile && !uploading && (
                    <div className="max-w-md mx-auto space-y-4 px-4">
                      <div className="text-left">
                        <label className="text-xs text-white/40 font-bold uppercase tracking-widest block mb-2">Document Title</label>
                        <input
                          type="text"
                          placeholder="e.g. My Aadhaar Card"
                          value={docTitle}
                          onChange={(e) => setDocTitle(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <button
                        onClick={handleFileUpload}
                        className="glow-button w-full justify-center py-4"
                      >
                        <FileUp size={18} />
                        Upload & Sign On-Chain
                      </button>
                    </div>
                  )}
                </div>

                {uploadError && uploadError === 'NOT_REGISTERED' ? (
                  <div className="glass-card border-yellow-500/30 bg-yellow-500/5 space-y-4">
                    <p className="text-yellow-400 font-bold">You need to register your DID before uploading on-chain.</p>
                    <p className="text-white/40 text-sm">Your document was uploaded to IPFS. Register below, then try the upload again to sign it on-chain.</p>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Enter your display name..."
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all"
                      />
                      <button
                        onClick={async () => {
                          if (!registerName.trim()) return;
                          setRegisteringDID(true);
                          try {
                            await registerDID(registerName.trim());
                            setIsRegistered(true);
                            setUploadError('');
                          } catch (err: any) {
                            const reason = err?.reason || err?.message || '';
                            if (reason.includes('Already registered')) {
                              setIsRegistered(true);
                              setUploadError('');
                            } else {
                              setUploadError(reason || 'Registration failed');
                            }
                          } finally {
                            setRegisteringDID(false);
                          }
                        }}
                        disabled={registeringDID || !registerName.trim()}
                        className="glow-button !py-3 !px-6 shrink-0 disabled:opacity-50"
                      >
                        {registeringDID ? 'Registering...' : 'Register DID'}
                      </button>
                    </div>
                  </div>
                ) : uploadError ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium">
                    {uploadError}
                  </div>
                ) : null}

                {documents.length === 0 ? (
                  <div className="text-center py-8 text-white/30">No documents uploaded yet.</div>
                ) : (
                  <div className="grid gap-4">
                    {documents.map((doc, i) => (
                      <div key={doc.ipfsHash + i} className="glass-card !py-5 hover:border-white/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center border border-green-500/20">
                              <CheckCircle2 className="text-green-400" size={20} />
                            </div>
                            <div>
                              <span className="font-bold block">{doc.title || doc.fileName}</span>
                              {doc.title && <span className="text-xs text-white/40 block">{doc.fileName}</span>}
                              <span className="text-xs text-white/30">
                                Uploaded {new Date(doc.uploadedAt).toLocaleDateString()} at {new Date(doc.uploadedAt).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <button
                              onClick={() => copyToClipboard(doc.ipfsHash)}
                              className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors"
                              title="Copy IPFS CID"
                            >
                              <Copy size={16} />
                            </button>
                            <a
                              href={doc.gateway}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors"
                              title="View on IPFS"
                            >
                              <ExternalLink size={16} className="text-white/40 hover:text-white" />
                            </a>
                            {doc.txHash && (
                              <a
                                href={`https://sepolia.etherscan.io/tx/${doc.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-indigo-500/10 rounded-lg border border-white/5 transition-colors text-white/40 hover:text-indigo-400"
                                title="View on Etherscan"
                              >
                                <Shield size={16} />
                              </a>
                            )}
                            <button
                              onClick={() => removeDocument(i)}
                              className="p-2 hover:bg-red-500/10 rounded-lg border border-white/5 transition-colors text-white/20 hover:text-red-400"
                              title="Remove from vault"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
                          <span className="text-xs font-bold text-white/20 uppercase tracking-widest">IPFS CID</span>
                          <span className="text-xs font-mono text-white/50 flex-1 truncate">{doc.ipfsHash}</span>
                          <span className="text-xs font-bold text-green-400/60 uppercase tracking-widest">Pinned</span>
                        </div>
                        {doc.txHash && (
                          <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2 mt-2">
                            <span className="text-xs font-bold text-white/20 uppercase tracking-widest">TX</span>
                            <a
                              href={`https://sepolia.etherscan.io/tx/${doc.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-mono text-indigo-400 hover:underline flex items-center gap-1 flex-1 truncate"
                            >
                              {doc.txHash} <ExternalLink size={12} />
                            </a>
                            <span className="text-xs font-bold text-green-400/60 uppercase tracking-widest">On-Chain</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* CREDENTIALS TAB */}
            {activeTab === 'credentials' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {loading ? (
                  <div className="text-center py-12 text-white/40">Loading credentials...</div>
                ) : credentials.length === 0 ? (
                  <div className="glass-card text-center py-12">
                    <Award className="text-white/10 mx-auto mb-4" size={48} />
                    <p className="text-white/40 text-lg">No credentials yet.</p>
                    <p className="text-white/20 mt-2">Ask an issuer to issue credentials to your DID.</p>
                    <button
                      onClick={() => account && copyToClipboard(formatDID(account))}
                      className="mt-6 glow-button mx-auto !py-3"
                    >
                      <Copy size={16} /> Copy your DID to share
                    </button>
                  </div>
                ) : (
                  credentials.map(cred => {
                    const status = getStatusInfo(cred);
                    const isVerifying = verifyingHash === cred.hash;
                    const thisVerifyResult = verifyResult?.hash === cred.hash ? verifyResult : null;

                    return (
                      <div key={cred.hash} className="glass-card relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-all"></div>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
                          <div className="flex items-start gap-5">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                              <Award className="text-indigo-400" size={28} />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold">{cred.credentialType}</h3>
                              <p className="text-white/40 text-sm">
                                Issued by <span className="text-white/70 font-bold">{shortenAddress(cred.issuer)}</span>
                                {' '}&bull; {formatDateTime(cred.issuedAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold border flex items-center gap-2 ${status.style}`}>
                              {status.icon}
                              {status.label}
                            </div>
                          </div>
                        </div>

                        {/* Credential details */}
                        <div className="bg-white/5 rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Credential Hash</p>
                            <p className="text-xs font-mono text-white/50 break-all">{cred.hash}</p>
                          </div>
                          <div>
                            <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Issuer Address</p>
                            <p className="text-xs font-mono text-white/50">{cred.issuer}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            onClick={() => handleVerifyCredential(cred.hash)}
                            disabled={isVerifying}
                            className="glow-button !py-2 !px-5 text-xs font-bold uppercase tracking-widest disabled:opacity-50"
                          >
                            {isVerifying ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                            {isVerifying ? 'Verifying...' : 'Verify On-Chain'}
                          </button>
                          <button
                            onClick={() => openQR(cred.hash)}
                            className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <Share2 size={14} />
                            Share
                          </button>
                          <button
                            onClick={() => copyToClipboard(cred.hash)}
                            className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <Copy size={14} />
                            Copy Hash
                          </button>
                          <a
                            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-5 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                          >
                            <ExternalLink size={14} />
                            Etherscan
                          </a>
                        </div>

                        {/* Verify result inline */}
                        <AnimatePresence>
                          {thisVerifyResult && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className={`mt-4 p-3 rounded-xl flex items-center gap-3 text-sm font-bold ${thisVerifyResult.valid ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                            >
                              {thisVerifyResult.valid ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                              {thisVerifyResult.valid ? 'On-chain verification passed — credential is authentic and active.' : 'Verification failed — credential is revoked or invalid.'}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}

            {/* ACTIVITY TAB */}
            {activeTab === 'activity' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {activityItems.length === 0 ? (
                  <div className="glass-card text-center py-12">
                    <Clock className="text-white/10 mx-auto mb-4" size={48} />
                    <p className="text-white/40 text-lg">No activity yet.</p>
                    <p className="text-white/20 mt-2">Upload documents or get credentials issued to see your history.</p>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[23px] top-0 bottom-0 w-[2px] bg-white/5"></div>

                    {activityItems.map((item, i) => {
                      const iconMap = {
                        issued: { icon: <ArrowDownLeft size={16} />, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
                        revoked: { icon: <ShieldAlert size={16} />, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
                        uploaded: { icon: <ArrowUpRight size={16} />, color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' },
                      };
                      const info = iconMap[item.type];

                      return (
                        <div key={item.hash + i} className="flex items-start gap-5 mb-6 relative">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 z-10 ${info.color}`}>
                            {info.icon}
                          </div>
                          <div className="glass-card !py-4 flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold">{item.title}</h4>
                              <span className="text-xs text-white/20">{formatDateTime(item.timestamp)}</span>
                            </div>
                            <p className="text-sm text-white/40">{item.subtitle}</p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-widest border ${
                                item.type === 'issued' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                item.type === 'revoked' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              }`}>
                                {item.type === 'issued' ? 'Credential Issued' : item.type === 'revoked' ? 'Credential Revoked' : 'Document Uploaded'}
                              </span>
                              <button
                                onClick={() => copyToClipboard(item.hash)}
                                className="text-xs text-white/20 hover:text-white/50 font-mono flex items-center gap-1"
                              >
                                <Copy size={12} />
                                {item.hash.slice(0, 10)}...
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {showQR && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 pb-24">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQR(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card relative z-10 max-w-sm w-full p-10 text-center border-indigo-500/30"
            >
              <button onClick={() => setShowQR(false)} className="absolute top-4 right-4 text-white/40 hover:text-white">
                <X size={24} />
              </button>
              <h3 className="text-2xl font-bold mb-6">Share Identity</h3>
              <div className="bg-white p-6 rounded-3xl mb-8 flex items-center justify-center scale-110 shadow-2xl shadow-indigo-500/20">
                <QRCode value={qrValue || 'no-data'} size={200} />
              </div>
              <p className="text-white/40 text-sm font-medium mb-4">Scan this QR to verify the credential on-chain.</p>
              <p className="text-white/20 text-xs font-mono break-all mb-8">{qrValue}</p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full glow-button justify-center py-4 uppercase tracking-[0.2em] font-black text-xs"
              >
                Close Portal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
