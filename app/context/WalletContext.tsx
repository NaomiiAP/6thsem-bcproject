'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useEffectEvent,
  ReactNode,
} from 'react';
import { ethers } from 'ethers';

interface WalletContextType {
  account: string | null;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
  chainId: number | null;
  isConnected: boolean;
  connectWallet: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType>({
  account: null,
  signer: null,
  provider: null,
  chainId: null,
  isConnected: false,
  connectWallet: async () => {},
  switchToSepolia: async () => {},
  disconnectWallet: () => {},
});

const SEPOLIA_CHAIN_ID = 11155111;
const SEPOLIA_HEX_CHAIN_ID = '0xaa36a7';

type WalletRequestArguments = {
  method: string;
  params?: readonly unknown[] | object;
};

type WalletEventHandler = (...args: unknown[]) => void;

type BrowserEthereumProvider = {
  isMetaMask?: boolean;
  request: (args: WalletRequestArguments) => Promise<unknown>;
  on?: (event: string, callback: WalletEventHandler) => void;
  removeListener?: (event: string, callback: WalletEventHandler) => void;
};

type WalletError = Error & {
  code?: number;
};

export function WalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const refreshWalletState = async () => {
    if (typeof window === 'undefined' || !window.ethereum) return;

    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    setProvider(browserProvider);

    const accounts = await browserProvider.listAccounts();
    if (accounts.length > 0) {
      const nextSigner = await browserProvider.getSigner();
      setAccount(await nextSigner.getAddress());
      setSigner(nextSigner);
    } else {
      setAccount(null);
      setSigner(null);
    }

    const network = await browserProvider.getNetwork();
    setChainId(Number(network.chainId));
  };

  const requestSepoliaNetwork = async (ethereum: BrowserEthereumProvider) => {
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_HEX_CHAIN_ID }],
      });
    } catch (error: unknown) {
      const walletError = error as WalletError;

      if (walletError.code === 4902) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: SEPOLIA_HEX_CHAIN_ID,
            chainName: 'Sepolia Testnet',
            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            rpcUrls: ['https://rpc.sepolia.org'],
            blockExplorerUrls: ['https://sepolia.etherscan.io'],
          }],
        });
        return;
      }

      throw walletError;
    }
  };

  const syncWalletState = useEffectEvent(async () => {
    await refreshWalletState();
  });

  useEffect(() => {
    void syncWalletState();

    const eth = typeof window !== 'undefined' ? window.ethereum : undefined;
    if (!eth) return;

    const handleAccountsChanged: WalletEventHandler = (...args) => {
      const accounts = Array.isArray(args[0]) ? (args[0] as string[]) : [];

      if (accounts.length === 0) {
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setChainId(null);
      } else {
        void syncWalletState();
      }
    };

    const handleChainChanged = () => {
      void syncWalletState();
    };

    eth.on?.('accountsChanged', handleAccountsChanged);
    eth.on?.('chainChanged', handleChainChanged);

    return () => {
      eth.removeListener?.('accountsChanged', handleAccountsChanged);
      eth.removeListener?.('chainChanged', handleChainChanged);
    };
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    const ethereum = window.ethereum as BrowserEthereumProvider;
    const browserProvider = new ethers.BrowserProvider(window.ethereum);
    await browserProvider.send('eth_requestAccounts', []);

    const network = await browserProvider.getNetwork();
    if (Number(network.chainId) !== SEPOLIA_CHAIN_ID) {
      await requestSepoliaNetwork(ethereum);
    }

    const nextSigner = await browserProvider.getSigner();
    const address = await nextSigner.getAddress();
    setProvider(browserProvider);
    setSigner(nextSigner);
    setAccount(address);
    setChainId(SEPOLIA_CHAIN_ID);
  };

  const switchToSepolia = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask!');
      return;
    }

    const ethereum = window.ethereum as BrowserEthereumProvider;
    await requestSepoliaNetwork(ethereum);
    await refreshWalletState();
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        signer,
        provider,
        chainId,
        isConnected: !!account,
        connectWallet,
        switchToSepolia,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
