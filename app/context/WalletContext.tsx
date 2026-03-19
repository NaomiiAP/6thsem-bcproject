'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  signer: null,
  provider: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  disconnectWallet: () => {},
});

const SEPOLIA_CHAIN_ID = 11155111;

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const setupProvider = useCallback(async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(browserProvider);

    const accounts = await browserProvider.listAccounts();
    if (accounts.length > 0) {
      const s = await browserProvider.getSigner();
      setAccount(await s.getAddress());
      setSigner(s);
    }

    const network = await browserProvider.getNetwork();
    setChainId(Number(network.chainId));
  }, []);

  useEffect(() => {
    setupProvider();

    const eth = typeof window !== 'undefined' ? window.ethereum : undefined;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
      } else {
        setupProvider();
      }
    };

    const handleChainChanged = () => {
      setupProvider();
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [setupProvider]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send('eth_requestAccounts', []);

    // Switch to Sepolia if not already
    const network = await browserProvider.getNetwork();
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }],
        });
      } catch (err: any) {
        if (err.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
        }
      }
    }

    const s = await browserProvider.getSigner();
    const addr = await s.getAddress();
    setProvider(browserProvider);
    setSigner(s);
    setAccount(addr);
    setChainId(SEPOLIA_CHAIN_ID);
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setChainId(null);
  };

  return (
    <WalletContext.Provider value={{ account, signer, provider, chainId, isConnected: !!account, connectWallet, disconnectWallet }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
