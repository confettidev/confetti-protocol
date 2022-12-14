import BigNumber from "bignumber.js";

export interface UserReserveData {
  scaledCTokenBalance: BigNumber;
  currentCTokenBalance: BigNumber;
  currentVariableDebt: BigNumber;
  scaledVariableDebt: BigNumber;
  liquidityRate: BigNumber;
  walletBalance: BigNumber;
  [key: string]: BigNumber | string | Boolean;
}

export interface ReserveData {
  address: string;
  symbol: string;
  decimals: BigNumber;
  totalLiquidity: BigNumber;
  availableLiquidity: BigNumber;
  totalVariableDebt: BigNumber;
  scaledVariableDebt: BigNumber;
  variableBorrowRate: BigNumber;
  utilizationRate: BigNumber;
  liquidityIndex: BigNumber;
  variableBorrowIndex: BigNumber;
  cTokenAddress: string;
  lastUpdateTimestamp: BigNumber;
  liquidityRate: BigNumber;
  [key: string]: BigNumber | string;
}

export interface NftData {
  address: string;
  symbol: string;
  cnftTokenAddress: string;
  redeemFine: BigNumber;
  [key: string]: BigNumber | string;
}

export interface LoanData {
  loanId: BigNumber;
  state: BigNumber;
  borrower: string;
  nftAsset: string;
  nftTokenId: BigNumber;
  reserveAsset: string;
  scaledAmount: BigNumber;
  currentAmount: BigNumber;
  buyItNowBuyerAddress: string;
  buyItNowPrice: BigNumber;
  buyItNowBorrowAmount: BigNumber;
  buyItNowFine: BigNumber;
  nftCfgRedeemFine: BigNumber;
  nftCfgMinBuyItNowFine: BigNumber;
  [key: string]: BigNumber | string | Boolean;
}
