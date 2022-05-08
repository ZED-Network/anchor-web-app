import {
  ANC_INPUT_MAXIMUM_DECIMAL_POINTS,
  ANC_INPUT_MAXIMUM_INTEGER_POINTS,
} from '@anchor-protocol/notation';
import { ANC, u } from '@anchor-protocol/types';
import { useRewardsAncGovernanceRewardsQuery } from '@anchor-protocol/app-provider';
import { useFixedFee } from '@libs/app-provider';
import { formatTimestamp, microfy } from '@libs/formatter';
import { ActionButton } from '@libs/neumorphism-ui/components/ActionButton';
import { NumberInput } from '@libs/neumorphism-ui/components/NumberInput';
import { InputAdornment } from '@material-ui/core';
import { StreamStatus } from '@rx-stream/react';
import big, { Big } from 'big.js';
import { MessageBox } from 'components/MessageBox';
import { TxFeeList, TxFeeListItem } from 'components/TxFeeList';
import { TxResultRenderer } from 'components/tx/TxResultRenderer';
import { ViewAddressWarning } from 'components/ViewAddressWarning';
import { useAccount } from 'contexts/account';
import { validateTxFee } from '@anchor-protocol/app-fns';
import React, { ChangeEvent, useCallback, useState } from 'react';
import { useBalances } from 'contexts/balances';
import { useMyVotingLockPeriodEndsAtQuery } from 'queries';
import { useRefCallback } from 'hooks';
import { useWithdrawAncTx } from 'tx/terra';
import { useFormatters } from '@anchor-protocol/formatter';

export function AncUnstake() {
  const { availablePost, connected } = useAccount();

  const fixedFee = useFixedFee();

  const { data: myLockPeriodEndsAt = 0 } = useMyVotingLockPeriodEndsAtQuery();

  const isLockPeriodOver =
    myLockPeriodEndsAt === undefined ? true : myLockPeriodEndsAt < Date.now();

  const [ancAmount, setANCAmount] = useState<ANC>('' as ANC);

  const { uUST } = useBalances();

  const { ust, anc } = useFormatters();

  const { data: { userGovStakingInfo } = {} } =
    useRewardsAncGovernanceRewardsQuery();

  const unstakableBalance = (
    userGovStakingInfo && isLockPeriodOver
      ? big(userGovStakingInfo.balance)
      : Big(0)
  ) as u<ANC<Big>>;

  const invalidTxFee = connected && validateTxFee(uUST, fixedFee);

  const invalidANCAmount =
    ancAmount.length === 0 || !unstakableBalance
      ? undefined
      : big(microfy(ancAmount)).gt(unstakableBalance)
      ? 'Not enough assets'
      : undefined;

  const init = useCallback(() => {
    setANCAmount('' as ANC);
  }, []);

  const onUnstakeSuccess = useRefCallback(() => {
    init();
  }, [init]);

  const [unstake, unstakeResult] = useWithdrawAncTx(onUnstakeSuccess);

  const proceed = useCallback(
    async (ancAmount: ANC) => {
      if (!connected || !unstake) {
        return;
      }

      unstake({
        amount: ancAmount,
      });
    },
    [connected, unstake],
  );

  if (
    unstakeResult?.status === StreamStatus.IN_PROGRESS ||
    unstakeResult?.status === StreamStatus.DONE
  ) {
    return (
      <TxResultRenderer
        resultRendering={unstakeResult.value}
        onExit={() => {
          setANCAmount('' as ANC);

          switch (unstakeResult.status) {
            case StreamStatus.IN_PROGRESS:
              unstakeResult.abort();
              break;
            case StreamStatus.DONE:
              unstakeResult.clear();
              break;
          }
        }}
      />
    );
  }

  const renderMessage = () => {
    if (!!invalidTxFee) {
      return <MessageBox>{invalidTxFee}</MessageBox>;
    }

    if (!isLockPeriodOver && myLockPeriodEndsAt) {
      return (
        <MessageBox>
          Your ANC is locked until {formatTimestamp(myLockPeriodEndsAt)}
        </MessageBox>
      );
    }

    return null;
  };

  return (
    <>
      {renderMessage()}

      <NumberInput
        className="amount"
        value={ancAmount}
        maxIntegerPoinsts={ANC_INPUT_MAXIMUM_INTEGER_POINTS}
        maxDecimalPoints={ANC_INPUT_MAXIMUM_DECIMAL_POINTS}
        error={!!invalidANCAmount}
        placeholder="0.00"
        onChange={({ target }: ChangeEvent<HTMLInputElement>) =>
          setANCAmount(target.value as ANC)
        }
        InputProps={{
          endAdornment: <InputAdornment position="end">ANC</InputAdornment>,
        }}
      />

      <div className="wallet" aria-invalid={!!invalidANCAmount}>
        <span>{invalidANCAmount}</span>
        <span>
          Balance:{' '}
          <span
            style={{
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
            onClick={() =>
              unstakableBalance &&
              setANCAmount(anc.demicrofy(unstakableBalance))
            }
          >
            {unstakableBalance
              ? anc.formatOutput(anc.demicrofy(unstakableBalance))
              : 0}{' '}
            ANC
          </span>
        </span>
      </div>

      {ancAmount.length > 0 && (
        <TxFeeList className="receipt">
          <TxFeeListItem label="Tx Fee">
            {ust.formatOutput(ust.demicrofy(fixedFee))} UST
          </TxFeeListItem>
        </TxFeeList>
      )}

      <ViewAddressWarning>
        <ActionButton
          className="submit"
          disabled={
            !availablePost ||
            !connected ||
            !unstake ||
            ancAmount.length === 0 ||
            big(ancAmount).lte(0) ||
            !!invalidTxFee ||
            !isLockPeriodOver ||
            !!invalidANCAmount
          }
          onClick={() => proceed(ancAmount)}
        >
          Unstake
        </ActionButton>
      </ViewAddressWarning>
    </>
  );
}
