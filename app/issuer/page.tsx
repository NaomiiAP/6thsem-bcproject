'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, ShieldCheck, Search, ShieldAlert, Award, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function Issuer() {
  const [activePortal, setActivePortal] = useState<'verification' | 'issuance'>('verification');
  
  const pendingRequests = [
    { id: '1', name: 'Alice Smith', document: 'Identity Card', date: '5 mins ago', status: 'Pending' },
    { id: '2', name: 'Bob Wilson', document: 'College Degree', date: '30 mins ago', status: 'Pending' },
    { id: '3', name: 'Charlie Brown', document: 'Driver License', date: '2 hours ago', status: 'Reviewing' }
  ];

  const [issueStatus, setIssueStatus] = useState<'idle' | 'signing' | 'success'>('idle');

  const handleIssue = () => {
    setIssueStatus('signing');
    setTimeout(() => setIssueStatus('success'), 2000);
    setTimeout(() => setIssueStatus('idle'), 5000);
  };

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
              onClick={() => setActivePortal('verification')}
              className={`px-6 py-3 rounded-xl transition-all font-bold ${activePortal === 'verification' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white'}`}
            >
              Verify Users
            </button>
            <button 
              onClick={() => setActivePortal('issuance')}
              className={`px-6 py-3 rounded-xl transition-all font-bold ${activePortal === 'issuance' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-white/40 hover:text-white'}`}
            >
              Issue Credentials
            </button>
          </div>
        </header>

        {activePortal === 'verification' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 relative">
                <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                <input 
                  type="text" 
                  placeholder="Search user DID or name..." 
                  className="w-full bg-white/5 border border-white/10 px-12 py-4 rounded-2xl focus:border-indigo-500 transition-all outline-none font-medium"
                />
              </div>
              <button className="glow-button py-4">Filter Results</button>
            </div>

            <div className="grid gap-4">
              {pendingRequests.map(req => (
                <div key={req.id} className="glass-card !py-6 flex items-center justify-between border-white/5 group hover:border-indigo-500/40">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center font-bold text-indigo-400 border border-indigo-500/20">
                      {req.name[0]}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{req.name}</h3>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{req.document}</span>
                        <span className="text-xs text-white/20">•</span>
                        <span className="text-xs text-white/40 font-bold uppercase tracking-widest">{req.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button className="px-6 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 font-bold transition-all flex items-center gap-2">
                       <FileText size={18} />
                       View Docs
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 hover:bg-green-500 hover:text-white font-bold transition-all">
                       Approve
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500 hover:text-white font-bold transition-all">
                       Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {activePortal === 'issuance' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto glass-card border-indigo-500/20"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                <Award className="text-indigo-400" size={28} />
              </div>
              <h2 className="text-2xl font-bold">Credential Configuration</h2>
            </div>

            <div className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase tracking-widest">User DID Address</label>
                  <input type="text" placeholder="did:ethr:0x..." className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-white/40 font-bold uppercase tracking-widest">Credential Type</label>
                  <select className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-bold appearance-none cursor-pointer">
                    <option>University Degree</option>
                    <option>Identity Card</option>
                    <option>Driver License</option>
                    <option>Health Certificate</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                 <label className="text-xs text-white/40 font-bold uppercase tracking-widest">Metadata JSON (signed data)</label>
                 <textarea 
                   rows={4} 
                   className="w-full bg-white/5 border border-white/10 px-4 py-3 rounded-xl outline-none focus:border-indigo-500 transition-all font-mono text-xs" 
                   defaultValue='{ "degree": "B.Tech CSE", "grade": "A+", "year": 2024 }'
                 />
              </div>

              <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-sm font-bold text-white/40">
                  <ShieldCheck className="text-green-400" size={20} />
                  ECDSA P256 Signing Enabled
                </div>
                <button 
                  onClick={handleIssue}
                  className={`glow-button !py-4 !px-12 ${issueStatus !== 'idle' ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  {issueStatus === 'signing' ? 'Digitally Signing...' : issueStatus === 'success' ? 'Issued on Sepolia' : 'Issue Credential'}
                </button>
              </div>

              <AnimatePresence>
                {issueStatus === 'success' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3 text-green-400 font-bold"
                  >
                    <CheckCircle size={20} />
                    Successfully issued and stored hash on Sepolia Network
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
