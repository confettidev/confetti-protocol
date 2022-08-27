import { LendPool } from "../../../types/LendPool";
import { ReserveData, UserReserveData, LoanData, NftData } from "./interfaces";
import {
  getIErc20Detailed,
  getMintableERC20,
  getMintableERC721,
  getCToken,
  getLendPoolLoanProxy,
  getDeploySigner,
  getDebtToken,
  getIErc721Detailed,
} from "../../../helpers/contracts-getters";
import { tEthereumAddress } from "../../../helpers/types";
import BigNumber from "bignumber.js";
import { getDb, DRE } from "../../../helpers/misc-utils";
import { ConfettiProtocolDataProvider } from "../../../types/ConfettiProtocolDataProvider";
import { ERC20Factory } from "../../../types";
import { SignerWithAddress } from "../make-suite";

export const getReserveData = async (
  helper: ConfettiProtocolDataProvider,
  reserve: tEthereumAddress
): Promise<ReserveData> => {
  const [reserveData, tokenAddresses, token] = await Promise.all([
    helper.getReserveData(reserve),
    helper.getReserveTokenData(reserve),
    getIErc20Detailed(reserve),
  ]);

  const debtToken = await getDebtToken(tokenAddresses.debtTokenAddress);

  const scaledVariableDebt = await debtToken.scaledTotalSupply();

  const symbol = await token.symbol();
  const decimals = new BigNumber(await token.decimals());

  const totalLiquidity = new BigNumber(
    reserveData.availableLiquidity.toString()
  ).plus(reserveData.totalVariableDebt.toString());

  const utilizationRate = new BigNumber(
    totalLiquidity.eq(0)
      ? 0
      : new BigNumber(reserveData.totalVariableDebt.toString()).rayDiv(
          totalLiquidity
        )
  );

  return {
    totalLiquidity,
    utilizationRate,
    availableLiquidity: new BigNumber(
      reserveData.availableLiquidity.toString()
    ),
    totalVariableDebt: new BigNumber(reserveData.totalVariableDebt.toString()),
    liquidityRate: new BigNumber(reserveData.liquidityRate.toString()),
    variableBorrowRate: new BigNumber(
      reserveData.variableBorrowRate.toString()
    ),
    liquidityIndex: new BigNumber(reserveData.liquidityIndex.toString()),
    variableBorrowIndex: new BigNumber(
      reserveData.variableBorrowIndex.toString()
    ),
    lastUpdateTimestamp: new BigNumber(reserveData.lastUpdateTimestamp),
    scaledVariableDebt: new BigNumber(scaledVariableDebt.toString()),
    address: reserve,
    cTokenAddress: tokenAddresses.cTokenAddress,
    symbol,
    decimals,
  };
};

export const getNftData = async (
  helper: ConfettiProtocolDataProvider,
  nftAsset: tEthereumAddress
): Promise<NftData> => {
  const [nftData, tokenAddresses, token] = await Promise.all([
    helper.getNftConfigurationData(nftAsset),
    helper.getNftTokenData(nftAsset),
    getIErc721Detailed(nftAsset),
  ]);

  const symbol = await token.symbol();

  return {
    redeemFine: new BigNumber(nftData.redeemFine.toString()),
    address: nftAsset,
    cnftTokenAddress: tokenAddresses.cNFTAddress,
    symbol,
  };
};

export const getUserData = async (
  pool: LendPool,
  helper: ConfettiProtocolDataProvider,
  reserve: string,
  user: tEthereumAddress,
  sender?: tEthereumAddress
): Promise<UserReserveData> => {
  const [userData, scaledCTokenBalance] = await Promise.all([
    helper.getUserReserveData(reserve, user),
    getCTokenUserData(reserve, user, helper),
  ]);

  const token = await getMintableERC20(reserve);
  const walletBalance = new BigNumber(
    (await token.balanceOf(sender || user)).toString()
  );

  return {
    scaledCTokenBalance: new BigNumber(scaledCTokenBalance),
    currentCTokenBalance: new BigNumber(
      userData.currentCTokenBalance.toString()
    ),
    currentVariableDebt: new BigNumber(userData.currentVariableDebt.toString()),
    scaledVariableDebt: new BigNumber(userData.scaledVariableDebt.toString()),
    liquidityRate: new BigNumber(userData.liquidityRate.toString()),
    walletBalance,
  };
};

export const getLoanData = async (
  pool: LendPool,
  helper: ConfettiProtocolDataProvider,
  nftAsset: string,
  nftTokenId: string,
  loanId: string
): Promise<LoanData> => {
  let loanData;
  let buyItNowData;
  let nftCfgData;

  if (loanId == undefined || loanId == "0") {
    [loanData, buyItNowData, nftCfgData] = await Promise.all([
      helper.getLoanDataByCollateral(nftAsset, nftTokenId),
      pool.getNftBuyItNowData(nftAsset, nftTokenId),
      helper.getNftConfigurationData(nftAsset),
    ]);
  } else {
    [loanData, buyItNowData, nftCfgData] = await Promise.all([
      helper.getLoanDataByLoanId(loanId),
      pool.getNftBuyItNowData(nftAsset, nftTokenId),
      helper.getNftConfigurationData(nftAsset),
    ]);
  }

  return {
    loanId: new BigNumber(loanData.loanId.toString()),
    state: new BigNumber(loanData.state),
    borrower: loanData.borrower,
    nftAsset: loanData.nftAsset,
    nftTokenId: new BigNumber(loanData.nftTokenId.toString()),
    reserveAsset: loanData.reserveAsset,
    scaledAmount: new BigNumber(loanData.scaledAmount.toString()),
    currentAmount: new BigNumber(loanData.currentAmount.toString()),
    buyItNowBuyerAddress: loanData.buyItNowBuyerAddress,
    buyItNowPrice: new BigNumber(loanData.buyItNowPrice.toString()),
    buyItNowBorrowAmount: new BigNumber(
      loanData.buyItNowBorrowAmount.toString()
    ),
    buyItNowFine: new BigNumber(buyItNowData.buyItNowFine.toString()),
    nftCfgRedeemFine: new BigNumber(nftCfgData.redeemFine.toString()),
    nftCfgMinBuyItNowFine: new BigNumber(nftCfgData.minBuyItNowFine.toString()),
  };
};

export const getReserveAddressFromSymbol = async (symbol: string) => {
  const token = await getMintableERC20(
    (
      await getDb(DRE.network.name).get(`${symbol}`).value()
    ).address
  );

  if (!token) {
    throw `Could not find instance for contract ${symbol}`;
  }
  return token.address;
};

export const getNftAddressFromSymbol = async (symbol: string) => {
  const token = await getMintableERC721(
    (
      await getDb(DRE.network.name).get(`${symbol}`).value()
    ).address
  );

  if (!token) {
    throw `Could not find instance for contract ${symbol}`;
  }
  return token.address;
};

const getCTokenUserData = async (
  reserve: string,
  user: string,
  dataProvider: ConfettiProtocolDataProvider
) => {
  const { cTokenAddress } = await dataProvider.getReserveTokenData(reserve);

  const cToken = await getCToken(cTokenAddress);

  const scaledBalance = await cToken.scaledBalanceOf(user);
  return scaledBalance.toString();
};

export const getERC20TokenBalance = async (
  reserve: string,
  user: tEthereumAddress
) => {
  const token = await ERC20Factory.connect(
    reserve,
    await getDeploySigner()
  ).balanceOf(user);

  return token;
};
