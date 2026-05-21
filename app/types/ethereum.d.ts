type EthereumRequestArguments = {
  method: string;
  params?: readonly unknown[] | object;
};

type EthereumEventHandler = (...args: unknown[]) => void;

interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: EthereumRequestArguments) => Promise<unknown>;
  on?: (event: string, callback: EthereumEventHandler) => void;
  removeListener?: (event: string, callback: EthereumEventHandler) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export {};
