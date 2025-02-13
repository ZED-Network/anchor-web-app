import React from 'react';
import { UIElementProps } from '@libs/ui';
import { createContext, useContext } from 'react';
import { useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

export enum Chain {
  Terra = 'Terra',
  Ethereum = 'Ethereum',
  Candle = 'Candle',
}

export const DEPLOYMENT_TARGETS = [
  {
    chain: Chain.Terra,
    icon: '/assets/terra-network-logo.png',
    isNative: true,
    isEVM: false,
  },
  // {
  //   chain: Chain.Ethereum,
  //   icon: '/assets/ethereum-logo.svg',
  //   isNative: false,
  //   isEVM: true,
  // },
  {
    chain: Chain.Candle,
    icon: '/assets/avalanche-logo.svg',
    isNative: false,
    isEVM: true,
  },
];

export interface DeploymentTarget {
  chain: Chain;
  icon: string;
  isNative: boolean;
  isEVM: boolean;
}

interface UseDeploymentTargetReturn {
  target: DeploymentTarget;
  updateTarget: (chainOrTarget: Chain | DeploymentTarget) => void;
}

export const DeploymentTargetContext = createContext<
  UseDeploymentTargetReturn | undefined
>(undefined);

const useDeploymentTarget = (): UseDeploymentTargetReturn => {
  const context = useContext(DeploymentTargetContext);
  if (context === undefined) {
    throw new Error('The DeploymentTargetContext has not been defined.');
  }
  return context;
};

const safeChain = (chain?: string) => {
  if (Boolean(DEPLOYMENT_TARGETS.find((d) => d.chain === chain))) {
    return chain;
  }

  return Chain.Terra;
};

const DeploymentTargetProvider = (props: UIElementProps) => {
  const { children } = props;

  const [storedChain, setChain] = useLocalStorage<string>(
    '__anchor_deployment_target__',
    DEPLOYMENT_TARGETS[0].chain,
  );

  const chain = safeChain(storedChain);

  const [target, updateTarget] = useState(
    DEPLOYMENT_TARGETS.filter((target) => target.chain === chain)[0],
  );

  const value = useMemo(() => {
    return {
      target,
      updateTarget: (chainOrTarget: Chain | DeploymentTarget) => {
        let found =
          typeof chainOrTarget === 'string'
            ? DEPLOYMENT_TARGETS.find((t) => t.chain === chainOrTarget)
            : chainOrTarget;

        if (found) {
          updateTarget(found);
          setChain(found.chain);
        }
      },
    };
  }, [target, updateTarget, setChain]);

  return (
    <DeploymentTargetContext.Provider value={value}>
      {children}
    </DeploymentTargetContext.Provider>
  );
};

export { DeploymentTargetProvider, useDeploymentTarget };
