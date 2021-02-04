import { CreateTxOptions, Msg } from '@terra-money/terra.js';

export const createOptions = (
  override: () => Required<Pick<CreateTxOptions, 'fee' | 'gasAdjustment'>> &
    Omit<CreateTxOptions, 'fee' | 'gasAdjustment' | 'msgs'>,
) => (msgs: Msg[]): CreateTxOptions => {
  return {
    msgs,
    ...override(),
  };
};
