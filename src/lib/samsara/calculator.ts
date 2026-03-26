export interface ForwardResult {
  inputAmount: number;
  buyFee: number;
  amountAfterFee: number;
  navTokens: number;
  borrowLimit: number;
  borrowFee: number;
  cashInBase: number;
  cashUsd: number;
}

export interface ReverseResult {
  desiredCashBase: number;
  desiredCashUsd: number;
  borrowLimitNeeded: number;
  navTokensNeeded: number;
  amountBeforeFee: number;
  assetNeeded: number;
}

/**
 * Forward calculation: given an asset amount, how much cash can be obtained?
 *
 * Flow: asset → deduct buy fee (in base) → buy navTokens → deposit → borrow against floor
 */
export function calculateForward(
  inputAmount: number,
  marketPrice: number,
  floorPrice: number,
  baseUsdPrice: number,
  buyFeeRate: number,
  borrowFeeRate: number,
): ForwardResult {
  // Buy fee is charged in base token
  const buyFee = inputAmount * buyFeeRate;
  const amountAfterFee = inputAmount - buyFee;
  const navTokens = amountAfterFee / marketPrice;
  const borrowLimit = navTokens * floorPrice;
  const borrowFee = borrowLimit * borrowFeeRate;
  const cashInBase = borrowLimit - borrowFee;
  const cashUsd = cashInBase * baseUsdPrice;

  return {
    inputAmount,
    buyFee,
    amountAfterFee,
    navTokens,
    borrowLimit,
    borrowFee,
    cashInBase,
    cashUsd,
  };
}

/**
 * Reverse calculation: given a desired cash amount, how much asset is needed?
 *
 * Inverts the forward formula to work backwards from desired output.
 */
export function calculateReverse(
  desiredCashBase: number,
  marketPrice: number,
  floorPrice: number,
  baseUsdPrice: number,
  buyFeeRate: number,
  borrowFeeRate: number,
): ReverseResult {
  const borrowLimitNeeded = desiredCashBase / (1 - borrowFeeRate);
  const navTokensNeeded = borrowLimitNeeded / floorPrice;
  // amountBeforeFee is the base token needed to buy navTokensNeeded
  const amountBeforeFee = navTokensNeeded * marketPrice;
  // Gross up for buy fee (charged in base token)
  const assetNeeded = amountBeforeFee / (1 - buyFeeRate);

  return {
    desiredCashBase,
    desiredCashUsd: desiredCashBase * baseUsdPrice,
    borrowLimitNeeded,
    navTokensNeeded,
    amountBeforeFee,
    assetNeeded,
  };
}
