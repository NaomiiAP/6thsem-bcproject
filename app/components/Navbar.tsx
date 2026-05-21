'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, UserCheck, Search, Wallet, LogOut } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { shortenAddress } from '../lib/contract';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { account, isConnected, connectWallet, disconnectWallet, switchToSepolia, chainId } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isWrongNetwork = chainId !== null && chainId !== 11155111;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0c]/80 backdrop-blur-md border-b border-white/10 py-3' : 'bg-transparent py-6'}`}>
      <div className="max-width px-6 mx-auto flex items-center justify-between" style={{ maxWidth: '1200px' }}>
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-500/20">
            <Shield className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">Trust<span className="gradient-text">ID</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/dashboard" className="nav-link flex items-center gap-2">
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link href="/issuer" className="nav-link flex items-center gap-2">
            <UserCheck size={18} />
            Issuer
          </Link>
          <Link href="/verifier" className="nav-link flex items-center gap-2">
            <Search size={18} />
            Verifier
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {isWrongNetwork && (
            <button
              onClick={() => void switchToSepolia()}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500/20"
            >
              Switch to Sepolia
            </button>
          )}
          {isConnected && account ? (
            <>
              <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80">
                <Wallet size={16} />
                {shortenAddress(account)}
              </div>
              <button
                onClick={disconnectWallet}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white flex items-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </button>
            </>
          ) : (
            <button
              onClick={connectWallet}
              className="glow-button"
            >
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
