import { microfy, UST, uUST } from '@anchor-protocol/notation';
import big, { Big, BigSource } from 'big.js';
import { Bank } from 'contexts/bank';
import { useMemo } from 'react';

export function useWithdrawTxFee(
  withdrawAmount: UST,
  bank: Bank,
  fixedGas: uUST<BigSource>,
): uUST<Big> | undefined {
  return useMemo(() => {
    if (withdrawAmount.length === 0) return undefined;

    // MIN((Withdrawable(User_input)- Withdrawable(User_input) / (1+Tax_rate)), Max_tax) + Fixed_Gas

    const uustAmount = microfy(withdrawAmount);
    const ratioTxFee = uustAmount.minus(
      uustAmount.div(big(1).add(bank.tax.taxRate)),
    );
    const maxTax = big(bank.tax.maxTaxUUSD);

    if (ratioTxFee.gt(maxTax)) {
      return maxTax.add(fixedGas) as uUST<Big>;
    } else {
      return ratioTxFee.add(fixedGas) as uUST<Big>;
    }
  }, [withdrawAmount, bank.tax.taxRate, bank.tax.maxTaxUUSD, fixedGas]);
}
