import { fabricatebAssetWithdrawUnbonded } from '@anchor-protocol/anchor-js/fabricators';
import { floor } from '@anchor-protocol/big-math';
import {
  createOperationOptions,
  effect,
  merge,
  OperationDependency,
  timeout,
} from '@anchor-protocol/broadcastable-operation';
import { StdFee } from '@terra-money/terra.js';
import { renderBroadcastTransaction } from 'components/TransactionRenderer';
import { pickWithdrawResult } from 'pages/basset/transactions/pickWithdrawResult';
import { createContractMsg } from 'transactions/createContractMsg';
import { createOptions } from 'transactions/createOptions';
import { getTxInfo } from 'transactions/getTxInfo';
import { postContractMsg } from 'transactions/postContractMsg';
import { injectTxFee, takeTxFee } from 'transactions/takeTxFee';
import { parseTxResult } from 'transactions/tx';

export const withdrawOptions = createOperationOptions({
  id: 'basset/withdraw',
  pipe: ({
    addressProvider,
    post,
    client,
    storage,
    signal,
    gasFee,
    gasAdjustment,
  }: OperationDependency<{}>) => [
    effect(fabricatebAssetWithdrawUnbonded, takeTxFee(storage)), // Option -> ((AddressProvider) -> MsgExecuteContract[])
    createContractMsg(addressProvider), // -> MsgExecuteContract[]
    createOptions(() => ({
      fee: new StdFee(gasFee, floor(storage.get('txFee')) + 'uusd'),
      gasAdjustment,
    })), // -> CreateTxOptions
    timeout(postContractMsg(post), 1000 * 60 * 2), // -> Promise<StringifiedTxResult>
    parseTxResult, // -> TxResult
    merge(getTxInfo(client, signal), injectTxFee(storage)), // -> { TxResult, TxInfo, txFee }
    pickWithdrawResult, // -> TransactionResult
  ],
  renderBroadcast: renderBroadcastTransaction,
  //breakOnError: true,
});
