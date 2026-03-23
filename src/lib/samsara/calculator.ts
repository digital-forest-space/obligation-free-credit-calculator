import { BUY_FEE_RATE, BORROW_FEE_RATE } from './config';

export interface ForwardResult {
  inputAmount: number;
  navTokens: number;
  buyFee: number;
  navTokensAfterFee: number;
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
  navTokensBeforeFee: number;
  assetNeeded: number;
}

/**
 * Forward calculation: given an asset amount, how much cash can be obtained?
 *
 * Flow: asset → buy navTokens → deposit → borrow against floor → sell borrowed tokens
 */
export function calculateForward(
  inputAmount: number,
  marketPrice: number,
  floorPrice: number,
  baseUsdPrice: number,
): ForwardResult {
  const navTokens = inputAmount / marketPrice;
  const buyFee = navTokens * BUY_FEE_RATE;
  const navTokensAfterFee = navTokens - buyFee;
  const borrowLimit = navTokensAfterFee * floorPrice;
  const borrowFee = borrowLimit * BORROW_FEE_RATE;
  const cashInBase = borrowLimit - borrowFee;
  const cashUsd = cashInBase * baseUsdPrice;

  return {
    inputAmount,
    navTokens,
    buyFee,
    navTokensAfterFee,
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
): ReverseResult {
  const borrowLimitNeeded = desiredCashBase / (1 - BORROW_FEE_RATE);
  const navTokensNeeded = borrowLimitNeeded / floorPrice;
  const navTokensBeforeFee = navTokensNeeded / (1 - BUY_FEE_RATE);
  const assetNeeded = navTokensBeforeFee * marketPrice;

  return {
    desiredCashBase,
    desiredCashUsd: desiredCashBase * baseUsdPrice,
    borrowLimitNeeded,
    navTokensNeeded,
    navTokensBeforeFee,
    assetNeeded,
  };
}
