import { eContractid, INftParams, SymbolMap } from '../../helpers/types';

export const strategyNftClassA: INftParams = {
  baseLTVAsCollateral: '5000', // 50%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "2", // 2 days
  buyItNowDuration: "2", // 2 days
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBuyItNowFine: "2000", // 0.2 ETH
  cNFTImpl: eContractid.CNFT,
};

export const strategyNftClassB: INftParams = {
  baseLTVAsCollateral: '4000', // 40%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "2", // 2 days
  buyItNowDuration: "2", // 2 days
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBuyItNowFine: "2000", // 0.2 ETH
  cNFTImpl: eContractid.CNFT,
};

export const strategyNftClassC: INftParams = {
  baseLTVAsCollateral: '3000', // 30%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "2", // 2 day
  buyItNowDuration: "2", // 2 day
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBuyItNowFine: "2000", // 0.2 ETH
  cNFTImpl: eContractid.CNFT,
};

export const strategyNftClassD: INftParams = {
  baseLTVAsCollateral: '2000', // 20%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "2", // 2 days
  buyItNowDuration: "2", // 2 days
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBuyItNowFine: "2000", // 0.2 ETH
  cNFTImpl: eContractid.CNFT,
};

export const strategyNftClassE: INftParams = {
  baseLTVAsCollateral: '1000', // 10%
  liquidationThreshold: '9000', // 90%
  liquidationBonus: '500', // 5%
  redeemDuration: "2", // 2 days
  buyItNowDuration: "2", // 2 days
  redeemFine: "500", // 5%
  redeemThreshold: "5000", // 50%
  minBuyItNowFine: "2000", // 0.2 ETH
  cNFTImpl: eContractid.CNFT,
};

export const strategyNftParams: SymbolMap<INftParams> = {
  "ClassA": strategyNftClassA,
  "ClassB": strategyNftClassB,
  "ClassC": strategyNftClassC,
  "ClassD": strategyNftClassD,
  "ClassE": strategyNftClassE,
};
