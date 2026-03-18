'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Wallet, Shield, Chrome, Apple, Smartphone } from 'lucide-react';

export default function Login() {
  const [connecting, setConnecting] = useState(false);

  const connectWallet = async () => {
    setConnecting(true);
    if (typeof window.ethereum !== 'undefined') {
      try {
        await (window.ethereum as any).request({ method: 'eth_requestAccounts' });
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Wallet connection failed:', error);
      } finally {
        setConnecting(false);
      }
    } else {
      alert('Please install MetaMask!');
      setConnecting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col pt-32 px-6">
      <Navbar />
      
      <div className="flex-1 flex items-center justify-center py-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card border-indigo-500/20 text-center"
        >
          <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-indigo-500/30">
            <Shield className="text-indigo-400" size={40} />
          </div>

          <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">Enter <span className="gradient-text">Vault</span></h1>
          <p className="text-white/40 mb-10 font-medium">Securely connect your wallet to access your decentralized identity.</p>

          <button 
            onClick={connectWallet}
            disabled={connecting}
            className="w-full glow-button !py-5 justify-center text-lg active:scale-95 disabled:opacity-50"
          >
            <Wallet size={24} />
            {connecting ? 'Confirming in Wallet...' : 'Connect MetaMask'}
          </button>

          <div className="mt-12 space-y-4">
             <div className="flex items-center gap-4 text-xs font-bold text-white/20 uppercase tracking-[0.2em]">
                <div className="h-[1px] flex-1 bg-white/5"></div>
                Other Providers
                <div className="h-[1px] flex-1 bg-white/5"></div>
             </div>

             <div className="flex justify-center gap-4">
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center opacity-40 hover:opacity-100 hover:border-indigo-500/40 cursor-pointer transition-all">
                   <Chrome size={20} />
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center opacity-40 hover:opacity-100 hover:border-indigo-500/40 cursor-pointer transition-all">
                   <Apple size={20} />
                </div>
                <div className="w-12 h-12 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center opacity-40 hover:opacity-100 hover:border-indigo-500/40 cursor-pointer transition-all">
                   <Smartphone size={20} />
                </div>
             </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
