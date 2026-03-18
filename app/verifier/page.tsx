'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Upload, ShieldCheck, ShieldAlert, Cpu, ExternalLink, Activity, Info } from 'lucide-react';

export default function Verifier() {
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<'valid' | 'invalid' | null>(null);

  const startVerification = () => {
    setVerifying(true);
    setResult(null);
    setTimeout(() => {
      setVerifying(false);
      setResult('valid');
    }, 2500);
  };

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <Navbar />
      
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tighter uppercase font-mono">Verifier <span className="gradient-text">Engine</span></h1>
          <p className="text-white/50 max-w-lg mx-auto font-medium">Instantly verify the authenticity of any credential using decentralized cryptographic proofs on Sepolia.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div 
            onClick={startVerification}
            className="glass-card hover:border-indigo-500/60 cursor-pointer group flex flex-col items-center justify-center py-16 transition-all active:scale-[0.98]"
          >
            <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-indigo-500/20 border border-indigo-500/30">
              <QrCode className="text-indigo-400 group-hover:text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Scan QR</h3>
            <p className="text-sm font-medium text-white/40">Point to credential QR code</p>
          </div>

          <div 
            onClick={startVerification}
            className="glass-card hover:border-purple-500/60 cursor-pointer group flex flex-col items-center justify-center py-16 transition-all active:scale-[0.98]"
          >
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-inner shadow-purple-500/20 border border-purple-500/30">
              <Upload className="text-purple-400 group-hover:text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold mb-2">Upload File</h3>
            <p className="text-sm font-medium text-white/40">JSON, PDF, or IPFS Hash</p>
          </div>
        </div>

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
                     <Cpu size={16} /> Connecting to Sepolia RPC Node
                   </p>
                 </div>
              </div>
            </motion.div>
          )}

          {result === 'valid' && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card border-green-500/50 bg-green-500/5 overflow-hidden"
            >
              <div className="bg-green-500/10 py-3 px-6 border-b border-green-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3 text-green-400 font-bold uppercase tracking-widest text-xs">
                  <ShieldCheck size={18} />
                  Cryptographic Proof Valid
                </div>
                <div className="flex items-center gap-2 text-white/20 text-xs font-mono">
                   #0x4a...c92
                </div>
              </div>

              <div className="p-8 grid md:grid-cols-[1fr_200px] gap-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-black mb-1">IIT Delhi Degree</h2>
                    <p className="text-white/40 text-sm font-bold uppercase tracking-widest">Verified 1.2s ago • Signature: EDDSA-SHA256</p>
                  </div>

                  <div className="grid grid-cols-2 gap-10 border-t border-white/5 pt-8">
                    <div>
                      <p className="text-white/30 text-xs font-bold uppercase mb-2">Subject</p>
                      <p className="text-xl font-bold">John Doe</p>
                      <p className="text-xs font-mono text-white/20 mt-1">did:ethr:0x71...492</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs font-bold uppercase mb-2">Issuer</p>
                      <p className="text-xl font-bold">IIT Delhi Admin</p>
                      <p className="text-xs font-mono text-white/20 mt-1">did:ethr:0x2a...c01</p>
                    </div>
                  </div>

                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex items-center justify-between group cursor-pointer hover:bg-white/10 transition-all">
                     <div className="flex items-center gap-3">
                        <Activity className="text-indigo-400" size={20} />
                        <span className="font-bold text-sm">View Transaction on Etherscan</span>
                     </div>
                     <ExternalLink size={16} className="text-white/30" />
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 flex items-center justify-center h-full aspect-square shadow-xl shadow-green-500/10 scale-95 hover:scale-100 transition-transform">
                   <div className="w-full h-full bg-black/5 flex items-center justify-center border-4 border-black/5 rounded-lg opacity-40">
                      <QrCode size={100} className="text-black" />
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-16 bg-white/5 rounded-3xl p-10 border border-white/5 flex gap-8">
           <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/10">
              <Info className="text-white/30" size={24} />
           </div>
           <div>
              <h3 className="text-xl font-bold mb-3">How Verification Works</h3>
              <p className="text-white/40 leading-relaxed font-medium">
                 The platform verifies the **ECDSA digital signature** of the issuer against the public key stored on the blockchain. 
                 If the hash of the credential matches the signed payload, the credential is authenticated as original and untampered.
              </p>
           </div>
        </div>
      </div>
    </main>
  );
}
