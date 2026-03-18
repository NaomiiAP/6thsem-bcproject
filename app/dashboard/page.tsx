'use client';

import QRCode from 'react-qr-code';
import { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { FileUp, Shield, Share2, Award, CheckCircle2, Copy, ExternalLink, X } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'profile' | 'docs' | 'credentials'>('profile');
  const [showQR, setShowQR] = useState(false);

  const credentials = [
    { id: 1, type: 'Aadhard Card', issuer: 'UIDAI', date: '2024-01-15', status: 'Verified' },
    { id: 2, type: 'University Degree', issuer: 'IIT Delhi', date: '2023-11-20', status: 'Issued' },
    { id: 3, type: 'Driver License', issuer: 'RTO Delhi', date: '2024-02-10', status: 'Pending' }
  ];

  return (
    <main className="min-h-screen bg-black text-white pt-32 pb-20 px-6">
      <Navbar />
      
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold mb-2">User <span className="gradient-text">Dashboard</span></h1>
          <p className="text-white/50">Manage your decentralized identity and credentials</p>
        </header>

        <div className="grid md:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="space-y-2">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'profile' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              Identity Profile
            </button>
            <button 
              onClick={() => setActiveTab('docs')}
              className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'docs' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              Document Vault
            </button>
            <button 
              onClick={() => setActiveTab('credentials')}
              className={`w-full text-left px-6 py-4 rounded-xl transition-all ${activeTab === 'credentials' ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-bold' : 'hover:bg-white/5 text-white/60'}`}
            >
              Verifiable Credentials
            </button>
          </aside>

          {/* Main Content */}
          <div className="space-y-8">
            {activeTab === 'profile' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card"
              >
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-xl shadow-indigo-500/20 font-black">
                    JD
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">John Doe</h2>
                    <p className="text-white/40 font-mono text-sm mb-2">did:ethr:0x71C...492</p>
                    <span className="px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/30 rounded-full text-xs font-bold uppercase tracking-widest">
                      Verified Identity
                    </span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                  <div>
                    <p className="text-white/30 text-xs mb-1 uppercase tracking-widest font-bold">Total Shareable Credentials</p>
                    <p className="text-3xl font-black">12</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-1 uppercase tracking-widest font-bold">Trust Score</p>
                    <p className="text-3xl font-black text-indigo-400">98%</p>
                  </div>
                </div>

                <div className="mt-10 flex gap-4">
                  <button onClick={() => setShowQR(true)} className="glow-button flex-1 justify-center py-4">
                    <Share2 size={20} />
                    Generate QR for Sharing
                  </button>
                  <button className="glass-card flex-1 justify-center py-4 border-white/5 hover:bg-white/5 font-bold transition-all">
                    Settings
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="glass-card border-dashed border-indigo-500/40 bg-indigo-500/5 py-12 text-center group cursor-pointer hover:bg-indigo-500/10 transition-all">
                  <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <FileUp className="text-indigo-400" size={32} />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Upload New Document</h3>
                  <p className="text-white/40 max-w-sm mx-auto">Upload Aadhaar, College ID, or Passport to request a verifiable credential.</p>
                </div>

                <div className="grid gap-4">
                  {['AadhaarCard_2024.pdf', 'DegreeCertificate.pdf'].map(doc => (
                    <div key={doc} className="glass-card !py-4 flex items-center justify-between hover:border-white/20">
                      <div className="flex items-center gap-4">
                        <Shield className="text-indigo-400" size={24} />
                        <span className="font-medium">{doc}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="text-xs font-bold text-white/30 uppercase tracking-widest">Encrypted IPFS</span>
                        <ExternalLink size={18} className="text-white/40 cursor-pointer" />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'credentials' && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid gap-6"
              >
                {credentials.map(cred => (
                  <div key={cred.id} className="glass-card relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-all"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-5">
                        <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                          <Award className="text-indigo-400" size={28} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{cred.type}</h3>
                          <p className="text-white/40 text-sm">Issued by <span className="text-white/70 font-bold">{cred.issuer}</span> • {cred.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className={`px-4 py-1.5 rounded-full text-xs font-bold border ${
                          cred.status === 'Verified' ? 'bg-green-500/10 text-green-400 border-green-500/30' : 
                          cred.status === 'Issued' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' : 
                          'bg-yellow-500/10 text-yellow-500 border-yellow-500/30'
                        }`}>
                          {cred.status}
                        </div>
                        <button className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors" title="Copy CID">
                          <Copy size={18} />
                        </button>
                        <button onClick={() => setShowQR(true)} className="glow-button !py-2 !px-4 text-xs font-bold uppercase tracking-widest">
                          Share
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </div>

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
                <QRCode value="did:ethr:0x71C...492" size={200} />
              </div>
              <p className="text-white/40 text-sm font-medium mb-8">This QR code contains your decentralized public identity. Scanners can verify your credentials instantly.</p>
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
