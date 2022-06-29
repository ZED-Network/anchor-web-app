import { Chain, useDeploymentTarget } from '@anchor-protocol/app-provider';
import React, { FunctionComponent, ReactNode } from 'react';

interface DeploymentSwitchProps {
  terra: FunctionComponent | ReactNode;
  ethereum: FunctionComponent | ReactNode;
  candle?: FunctionComponent | ReactNode;
}

export function DeploymentSwitch(props: DeploymentSwitchProps) {
  const { terra, ethereum, candle } = props;
  const {
    target: { chain },
  } = useDeploymentTarget();
  let content: ReactNode;

  switch (chain) {
    case Chain.Terra:
      content = terra;
      break;
    case Chain.Ethereum:
      content = ethereum;
      break;
    case Chain.Candle:
      content = candle ?? ethereum;
      break;
    default:
      content = <></>;
  }

  return typeof content === 'function' ? content() : content;
}
