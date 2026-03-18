'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Fingerprint, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center p-6 pt-32 text-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute top-20 left-10 w-48 h-48 bg-indigo-500/20 blur-[100px] rounded-full animate-pulse transition-opacity duration-1000 opacity-70"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-600/20 blur-[120px] rounded-full animate-float transition-opacity duration-1000 opacity-60"></div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-width z-10"
        style={{ maxWidth: '900px' }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm font-semibold mb-8 animate-bounce transition-all">
          <Fingerprint size={16} />
          <span>The Future of Digital Identity</span>
        </div>

        <h1 className="text-5xl md:text-8xl font-black leading-tight mb-8">
          Own Your <br />
          <span className="gradient-text tracking-tighter">Identity</span>
        </h1>

        <p className="text-xl md:text-2xl text-white/50 mb-12 max-w-2xl mx-auto leading-relaxed">
          The next generation of self-sovereign identity powered by blockchain. 
          Secure, verifiable, and entirely in your control.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link href="/dashboard">
            <button className="glow-button px-10 py-5 text-lg shadow-2xl shadow-indigo-500/40 active:scale-95">
              Create Identity
              <ArrowRight size={22} className="group-hover:translate-x-1" />
            </button>
          </Link>
          <button className="px-10 py-5 text-lg glass-card border-none hover:bg-white/5 font-semibold transition-all">
            See How it Works
          </button>
        </div>
      </motion.div>

      <div className="mt-24 grid md:grid-cols-3 gap-8 max-w-6xl w-full">
        <div className="glass-card hover:translate-y-[-10px] transition-transform group">
          <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            <ShieldCheck className="text-indigo-400 group-hover:text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Secure</h3>
          <p className="text-white/40 leading-relaxed font-medium">
            End-to-end encrypted identity data stored on the decentralized ledger. 
            No more single points of failure or data breaches.
          </p>
        </div>

        <div className="glass-card hover:translate-y-[-10px] transition-transform group">
          <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
            <Fingerprint className="text-purple-400 group-hover:text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Self-Sovereign</h3>
          <p className="text-white/40 leading-relaxed font-medium">
            You own the keys to your identity. Disclose only what you want, 
            to whom you want, and for how long. Total control.
          </p>
        </div>

        <div className="glass-card hover:translate-y-[-10px] transition-transform group">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-white transition-colors">
            <Zap className="text-cyan-400 group-hover:text-white" size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-3">Instant Verification</h3>
          <p className="text-white/40 leading-relaxed font-medium">
            Verifiers can check the authenticity of your documents in milliseconds 
            without ever needing to store your private data.
          </p>
        </div>
      </div>
    </section>
  );
}
