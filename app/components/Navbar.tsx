'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Shield, LayoutDashboard, UserCheck, Search, Wallet } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { shortenAddress } from '../lib/contract';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { account, isConnected, connectWallet, chainId } = useWallet();

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
            <span className="text-xs text-red-400 font-bold">Wrong Network</span>
          )}
          <button
            onClick={connectWallet}
            className="glow-button"
          >
            <Wallet size={18} />
            {isConnected && account ? shortenAddress(account) : 'Connect Wallet'}
          </button>
        </div>
      </div>
    </nav>
  );
}
