import { fabricateBorrow } from '@anchor-protocol/anchor-js/fabricators';
import { floor } from '@anchor-protocol/big-math';
import {
  createOperationOptions,
  effect,
  merge,
  OperationDependency,
  timeout,
} from '@anchor-protocol/broadcastable-operation';
import { WalletStatus } from '@anchor-protocol/wallet-provider';
import { StdFee } from '@terra-money/terra.js';
import { renderBroadcastTransaction } from 'components/TransactionRenderer';
import { pickBorrowResult } from 'pages/borrow/transactions/pickBorrowResult';
import { refetchMarket } from 'pages/borrow/transactions/refetchMarket';
import { createContractMsg } from 'transactions/createContractMsg';
import { createOptions } from 'transactions/createOptions';
import { getTxInfo } from 'transactions/getTxInfo';
import { postContractMsg } from 'transactions/postContractMsg';
import { injectTxFee, takeTxFee } from 'transactions/takeTxFee';
import { parseTxResult } from 'transactions/tx';

interface DependencyList {
  walletStatus: WalletStatus;
}

export const borrowOptions = createOperationOptions({
  id: 'borrow/borrow',
  pipe: ({
    addressProvider,
    post,
    client,
    walletStatus,
    signal,
    storage,
    gasAdjustment,
    gasFee,
  }: OperationDependency<DependencyList>) => [
    effect(fabricateBorrow, takeTxFee(storage)), // Option -> ((AddressProvider) -> MsgExecuteContract[])
    createContractMsg(addressProvider), // -> MsgExecuteContract[]
    createOptions(() => ({
      fee: new StdFee(gasFee, floor(storage.get('txFee')) + 'uusd'),
      gasAdjustment,
    })), // -> CreateTxOptions
    timeout(postContractMsg(post), 1000 * 60 * 2), // -> Promise<StringifiedTxResult>
    parseTxResult, // -> TxResult
    getTxInfo(client, signal), // -> { TxResult, TxInfo }
    merge(
      refetchMarket(addressProvider, client, walletStatus),
      injectTxFee(storage),
    ), // -> { TxResult, TxInfo, MarketBalanceOverview, MarketOverview, MarketUserOverview, txFee }
    pickBorrowResult, // -> TransactionResult
  ],
  renderBroadcast: renderBroadcastTransaction,
  //breakOnError: true,
});
