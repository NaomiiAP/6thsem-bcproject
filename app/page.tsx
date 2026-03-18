import Image from "next/image";
import Navbar from './components/Navbar';
import Hero from './components/Hero';

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-black text-white">
      <Navbar />
      <Hero />
      <footer className="footer bg-black py-12 border-t border-white/5 opacity-40">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm font-medium">
          <p>© 2026 TrustID. All rights reserved.</p>
          <div className="flex gap-8">
            <a href="#" className="hover:text-primary transition-colors">Twitter</a>
            <a href="#" className="hover:text-primary transition-colors">GitHub</a>
            <a href="#" className="hover:text-primary transition-colors">Discord</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
