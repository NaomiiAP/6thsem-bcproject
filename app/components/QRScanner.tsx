'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Camera, XCircle } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const [error, setError] = useState('');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = 'qr-reader';

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    const state = scanner.getState();
    if (
      state !== Html5QrcodeScannerState.SCANNING &&
      state !== Html5QrcodeScannerState.PAUSED
    ) {
      return;
    }

    try {
      await scanner.stop();
    } catch (stopError) {
      console.error('QR scanner stop error:', stopError);
    }
  };

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          await stopScanner();
          onScan(decodedText);
        },
        () => {
          // Ignore scan failures while waiting for a valid QR in frame.
        }
      )
      .catch((startError) => {
        setError('Could not access camera. Make sure you allow camera permissions.');
        console.error('QR scanner error:', startError);
      });

    return () => {
      void stopScanner();
    };
  }, [onScan]);

  return (
    <div className="glass-card border-indigo-500/30 mb-12 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Camera size={20} className="text-indigo-400" />
          <h3 className="font-bold">Scanning for QR Code...</h3>
        </div>
        <button
          onClick={() => {
            void stopScanner();
            onClose();
          }}
          className="p-2 hover:bg-white/5 rounded-lg border border-white/5 transition-colors text-white/40 hover:text-white"
        >
          <XCircle size={20} />
        </button>
      </div>

      {error ? (
        <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
          {error}
        </div>
      ) : (
        <div
          id={containerId}
          className="w-full rounded-xl overflow-hidden"
          style={{ minHeight: 300 }}
        />
      )}

      <p className="text-white/30 text-xs text-center mt-4">
        Point your camera at a TrustID credential QR code
      </p>
    </div>
  );
}
