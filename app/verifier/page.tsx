'use client';

import { useState, useCallback, lazy, Suspense } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Upload, ShieldCheck, ShieldAlert, Cpu, ExternalLink, Activity, Info, RefreshCw, Copy, Clock, Camera } from 'lucide-react';
import { useTrustID } from '../hooks/useTrustID';
import { shortenAddress, formatDID, CONTRACT_ADDRESS } from '../lib/contract';

const QRScanner = lazy(() => import('../components/QRScanner'));

interface VerificationResult {
  valid: boolean;
  hash: string;
  subject: string;
  issuer: string;
  credentialType: string;
  issuedAt: number;
  revoked: boolean;
  subjectName: string;
  issuerName: string;
  verifiedAt: number;
}

export default function Verifier() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [hashInput, setHashInput] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<VerificationResult[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const { verifyCredential, getProfile } = useTrustID();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const startVerification = async (hash?: string) => {
    const credHash = hash || hashInput.trim();
    if (!credHash) {
      setShowInput(true);
      return;
    }
    if (!/^0x[a-fA-F0-9]{64}$/.test(credHash)) {
      setError('Invalid credential hash. Must be a 0x-prefixed 32-byte hex string.');
      return;
    }

    setVerifying(true);
    setResult(null);
    setError('');

    try {
      const data = await verifyCredential(credHash);

      if (!data.valid && data.issuedAt === 0) {
        setError('Credential not found on-chain.');
        setVerifying(false);
        return;
      }

      const [subjectProfile, issuerProfile] = await Promise.all([
        getProfile(data.subject),
        getProfile(data.issuer),
      ]);

      const verificationResult: VerificationResult = {
        ...data,
        hash: credHash,
        subjectName: subjectProfile.name || shortenAddress(data.subject),
        issuerName: issuerProfile.name || shortenAddress(data.issuer),
        verifiedAt: Date.now(),
      };

      setResult(verificationResult);
      setHistory(prev => [verificationResult, ...prev.filter(h => h.hash !== credHash)]);
    } catch (err: any) {
      setError(err?.reason || err?.message || 'Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.credentialHash) {
          setHashInput(json.credentialHash);
          startVerification(json.credentialHash);
        } else {
          setError('Invalid JSON file. Must contain a "credentialHash" field.');
        }
      } catch {
        setError('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const onQRScan = useCallback((data: string) => {
    setShowScanner(false);
    // The QR might contain a raw hash or a did:ethr: string
    const trimmed = data.trim();
    setHashInput(trimmed);
    if (/^0x[a-fA-F0-9]{64}$/.test(trimmed)) {
      startVerification(trimmed);
    } else {
      // Show it in the input so user can see what was scanned
      setShowInput(true);
      setError('Scanned value is not a valid credential hash. Got: ' + trimmed.slice(0, 40) + '...');
    }
  }, []);

  const verifyAgain = () => {
    setResult(null);
    setError('');
    setShowScanner(false);
    setShowInput(true);
  };

  const verifyFromHistory = (hash: string) => {
    setHashInput(hash);
    startVerification(hash);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <Navbar />

      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase font-mono">Verifier <span className="gradient-text">Engine</span></h1>
          <p className="text-white/50 max-w-lg mx-auto font-medium">Instantly verify the authenticity of any credential using decentralized cryptographic proofs on Sepolia.</p>
        </header>

        {/* Entry cards — show when no result */}
        {!result && !verifying && !showScanner && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div
              onClick={() => { setError(''); setShowScanner(true); }}
              className="glass-card hover:border-cyan-500/60 cursor-pointer group flex flex-col items-center justify-center py-14 transition-all active:scale-[0.98]"
            >
              <div className="w-20 h-20 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-cyan-500/20 border border-cyan-500/30">
                <Camera className="text-cyan-400 group-hover:text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Scan QR</h3>
              <p className="text-sm font-medium text-white/40">Use camera to scan a QR code</p>
            </div>

            <div
              onClick={() => { setError(''); setShowInput(true); }}
              className="glass-card hover:border-indigo-500/60 cursor-pointer group flex flex-col items-center justify-center py-14 transition-all active:scale-[0.98]"
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-indigo-500/20 border border-indigo-500/30">
                <QrCode className="text-indigo-400 group-hover:text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Enter Hash</h3>
              <p className="text-sm font-medium text-white/40">Paste a credential hash to verify</p>
            </div>

            <label className="glass-card hover:border-purple-500/60 cursor-pointer group flex flex-col items-center justify-center py-14 transition-all active:scale-[0.98]">
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-purple-500/20 border border-purple-500/30">
                <Upload className="text-purple-400 group-hover:text-white" size={40} />
              </div>
              <h3 className="text-2xl font-bold mb-2">Upload File</h3>
              <p className="text-sm font-medium text-white/40">JSON with credentialHash field</p>
            </label>
          </div>
        )}

        {/* QR Camera Scanner */}
        {showScanner && !verifying && !result && (
          <Suspense fallback={<div className="text-center py-12 text-white/40">Loading camera...</div>}>
            <QRScanner onScan={onQRScan} onClose={() => setShowScanner(false)} />
          </Suspense>
        )}

        {/* Hash input */}
        <AnimatePresence>
          {showInput && !verifying && !result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="glass-card mb-12"
            >
              <label className="text-xs text-white/40 font-bold uppercase tracking-widest block mb-3">Credential Hash</label>
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="0x..."
                  value={hashInput}
                  onChange={(e) => { setHashInput(e.target.value); setError(''); }}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-4 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono text-sm"
                />
                <button
                  onClick={() => startVerification()}
                  className="glow-button !px-8"
                >
                  Verify
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass-card border-red-500/30 bg-red-500/5 py-8 text-center mb-12"
            >
              <ShieldAlert className="text-red-400 mx-auto mb-4" size={40} />
              <p className="text-red-400 font-bold text-lg mb-4">{error}</p>
              <button onClick={() => { setError(''); setShowInput(true); }} className="text-sm text-white/40 hover:text-white underline">
                Try again
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading spinner */}
        <AnimatePresence>
          {verifying && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass-card bg-indigo-500/5 border-indigo-500/30 py-12 text-center mb-12"
            >
              <div className="flex flex-col items-center gap-6">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
                <div>
                  <h2 className="text-2xl font-bold mb-2">Fetching Blockchain State...</h2>
                  <p className="text-white/40 flex items-center justify-center gap-2">
                    <Cpu size={16} /> Querying Sepolia RPC Node
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 mb-12"
            >
              <div className={`glass-card overflow-hidden ${result.valid ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'}`}>
                {/* Header bar */}
                <div className={`py-3 px-6 border-b flex items-center justify-between ${result.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className={`flex items-center gap-3 font-bold uppercase tracking-widest text-xs ${result.valid ? 'text-green-400' : 'text-red-400'}`}>
                    {result.valid ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                    {result.valid ? 'Cryptographic Proof Valid' : result.revoked ? 'Credential Revoked' : 'Invalid Credential'}
                  </div>
                  <div className="flex items-center gap-2 text-white/20 text-xs font-mono">
                    {shortenAddress(result.hash)}
                  </div>
                </div>

                <div className="p-8">
                  <div className="space-y-6">
                    {/* Credential info */}
                    <div>
                      <h2 className="text-3xl font-black mb-1">{result.credentialType}</h2>
                      <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
                        Verified just now &bull; Issued {formatDate(result.issuedAt)}
                      </p>
                    </div>

                    {/* Subject & Issuer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-8">
                      <div>
                        <p className="text-white/30 text-xs font-bold uppercase mb-2">Subject</p>
                        <p className="text-xl font-bold">{result.subjectName}</p>
                        <p className="text-xs font-mono text-white/20 mt-1 break-all">{formatDID(result.subject)}</p>
                      </div>
                      <div>
                        <p className="text-white/30 text-xs font-bold uppercase mb-2">Issuer</p>
                        <p className="text-xl font-bold">{result.issuerName}</p>
                        <p className="text-xs font-mono text-white/20 mt-1 break-all">{formatDID(result.issuer)}</p>
                      </div>
                    </div>

                    {/* Full hash */}
                    <div className="bg-white/5 rounded-xl p-4">
                      <p className="text-white/20 text-xs uppercase tracking-widest font-bold mb-1">Full Credential Hash</p>
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-mono text-white/50 flex-1 break-all">{result.hash}</p>
                        <button onClick={() => copyToClipboard(result.hash)} className="p-2 hover:bg-white/5 rounded-lg border border-white/5 shrink-0">
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Etherscan link */}
                    <a
                      href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="text-indigo-400" size={20} />
                        <span className="font-bold text-sm">View Contract on Etherscan</span>
                      </div>
                      <ExternalLink size={16} className="text-white/30" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-4">
                <button onClick={verifyAgain} className="glow-button flex-1 justify-center py-4">
                  <RefreshCw size={18} />
                  Verify Another
                </button>
                <button
                  onClick={() => startVerification(result.hash)}
                  className="glass-card flex-1 justify-center py-4 border-white/5 hover:bg-white/5 font-bold transition-all flex items-center gap-2"
                >
                  <ShieldCheck size={18} />
                  Re-verify This
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Verification History */}
        {history.length > 0 && !verifying && (
          <div className="mb-12">
            <h3 className="text-sm font-bold text-white/30 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Clock size={14} /> Recent Verifications
            </h3>
            <div className="grid gap-3">
              {history.map((h, i) => (
                <div
                  key={h.hash + i}
                  onClick={() => verifyFromHistory(h.hash)}
                  className="glass-card !py-4 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${h.valid ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                      {h.valid ? <ShieldCheck size={18} className="text-green-400" /> : <ShieldAlert size={18} className="text-red-400" />}
                    </div>
                    <div>
                      <p className="font-bold">{h.credentialType}</p>
                      <p className="text-xs text-white/30">
                        {h.subjectName} &bull; by {h.issuerName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${h.valid ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {h.valid ? 'Valid' : 'Invalid'}
                    </span>
                    <span className="text-xs text-white/20">{new Date(h.verifiedAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How it works */}
        <div className="bg-white/5 rounded-3xl p-10 border border-white/5 flex gap-8">
          <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
            <Info className="text-white/30" size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold mb-3">How Verification Works</h3>
            <p className="text-white/40 leading-relaxed font-medium">
              The credential hash is checked against on-chain data stored in the TrustID smart contract on Sepolia.
              If the hash exists, was issued by a registered DID, and has not been revoked, the credential is authenticated as valid.
              No wallet connection is needed — verification uses a read-only RPC call.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
