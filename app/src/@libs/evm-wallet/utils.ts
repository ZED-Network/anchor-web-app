import { ConnectType } from './types';
import { Connector } from '@web3-react/types';
import { MetaMask } from '@web3-react/metamask';
import { WalletConnect } from '@web3-react/walletconnect';
import { EvmChainId } from '@anchor-protocol/crossanchor-sdk';
import { Chain } from '@anchor-protocol/app-provider';

export const getConnectionType = (connector: Connector): ConnectType => {
  if (connector instanceof MetaMask) {
    return ConnectType.MetaMask;
  }
  if (connector instanceof WalletConnect) {
    return ConnectType.WalletConnect;
  }
  return ConnectType.None;
};

interface DefaultEvmChainId {
  mainnet: number;
  testnet: number;
}

export const getDefaultEvmChainId = (chain: Chain): DefaultEvmChainId => {
  switch (chain) {
    case Chain.Candle:
      return {
        mainnet: EvmChainId.CANDLE,
        testnet: EvmChainId.AVALANCHE_FUJI_TESTNET,
      };
    default:
      return {
        mainnet: EvmChainId.ETHEREUM,
        testnet: EvmChainId.ETHEREUM_ROPSTEN,
      };
  }
};

export const getEvmDeploymentTargetChain = (evmChainId: EvmChainId): Chain => {
  switch (evmChainId) {
    case EvmChainId.ETHEREUM:
    case EvmChainId.ETHEREUM_ROPSTEN:
      return Chain.Ethereum;

    case EvmChainId.CANDLE:
    case EvmChainId.AVALANCHE_FUJI_TESTNET:
      return Chain.Candle;
  }
  return Chain.Candle;
};
