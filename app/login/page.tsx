'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Wallet, Shield, Chrome, Apple, Smartphone, Loader2 } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useTrustID } from '../hooks/useTrustID';

export default function Login() {
  const [connecting, setConnecting] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [name, setName] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const { connectWallet, account, isConnected } = useWallet();
  const { getProfile, registerDID } = useTrustID();
  const router = useRouter();

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setConnecting(false);
    }
  };

  // Automatically check registration once account is available
  useEffect(() => {
    if (!account || needsRegistration) return;
    let cancelled = false;
    const checkStatus = async () => {
      setCheckingStatus(true);
      try {
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 8000)
        );
        const profile = await Promise.race([getProfile(account), timeout]);
        if (cancelled) return;
        if (profile.isRegistered) {
          router.push('/dashboard');
        } else {
          setNeedsRegistration(true);
        }
      } catch {
        if (cancelled) return;
        // On timeout or error, stop loading so user can proceed manually
      } finally {
        if (!cancelled) setCheckingStatus(false);
      }
    };
    checkStatus();
    return () => { cancelled = true; };
  }, [account]);

  const handleRegister = async () => {
    if (!name.trim()) return;
    setRegistering(true);
    try {
      await registerDID(name.trim());
      router.push('/dashboard');
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Make sure you have Sepolia ETH for gas.');
    } finally {
      setRegistering(false);
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

          {!isConnected ? (
            <>
              <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">Enter <span className="gradient-text">Vault</span></h1>
              <p className="text-white/40 mb-10 font-medium">Securely connect your wallet to access your decentralized identity.</p>

              <button
                onClick={handleConnect}
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
            </>
          ) : needsRegistration ? (
            <>
              <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">Register <span className="gradient-text">DID</span></h1>
              <p className="text-white/40 mb-8 font-medium">Create your on-chain decentralized identity on Sepolia.</p>

              <input
                type="text"
                placeholder="Enter your display name..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 px-4 py-4 rounded-xl outline-none focus:border-indigo-500 transition-all font-medium mb-6 text-center"
              />

              <button
                onClick={handleRegister}
                disabled={registering || !name.trim()}
                className="w-full glow-button !py-5 justify-center text-lg active:scale-95 disabled:opacity-50"
              >
                <Shield size={24} />
                {registering ? 'Registering on Sepolia...' : 'Register Identity'}
              </button>
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">Wallet <span className="gradient-text">Connected</span></h1>
              <p className="text-white/40 mb-8 font-medium">
                {checkingStatus ? 'Checking your identity status...' : 'Ready to continue.'}
              </p>

              {checkingStatus ? (
                <div className="w-full glow-button !py-5 justify-center text-lg opacity-70 pointer-events-none">
                  <Loader2 size={24} className="animate-spin" />
                  Checking Registration...
                </div>
              ) : (
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full glow-button !py-5 justify-center text-lg active:scale-95"
                >
                  Continue to Dashboard
                </button>
              )}
            </>
          )}
        </motion.div>
      </div>
    </main>
  );
}
