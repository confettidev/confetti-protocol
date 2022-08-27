import {
  eContractid,
  eNetwork,
  iMultiPoolsAssets,
  IReserveParams,
  iMultiPoolsNfts,
  INftParams,
  tEthereumAddress,
} from "./types";
import { chunk, waitForTx } from "./misc-utils";
import {
  getLendPoolAddressesProvider,
  getLendPoolConfiguratorProxy,
} from "./contracts-getters";
import {
  getContractAddressWithJsonFallback,
  rawInsertContractAddressInDb,
} from "./contracts-helpers";
import { BigNumberish } from "ethers";
import { ConfigNames } from "./configuration";
import { deployRateStrategy } from "./contracts-deployments";

export const getCTokenExtraParams = async (
  cTokenName: string,
  tokenAddress: tEthereumAddress
) => {
  //console.log(cTokenName);
  switch (cTokenName) {
    default:
      return "0x10";
  }
};

export const initReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  cTokenNamePrefix: string,
  cTokenSymbolPrefix: string,
  debtTokenNamePrefix: string,
  debtTokenSymbolPrefix: string,
  admin: tEthereumAddress,
  treasuryAddress: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean
) => {
  const addressProvider = await getLendPoolAddressesProvider();

  // CHUNK CONFIGURATION
  const initChunks = 1;

  // Initialize variables for future reserves initialization
  let reserveSymbols: string[] = [];

  let initInputParams: {
    cTokenImpl: string;
    debtTokenImpl: string;
    underlyingAssetDecimals: BigNumberish;
    interestRateAddress: string;
    underlyingAsset: string;
    treasury: string;
    underlyingAssetName: string;
    cTokenName: string;
    cTokenSymbol: string;
    debtTokenName: string;
    debtTokenSymbol: string;
  }[] = [];

  let strategyRates: [
    string, // addresses provider
    string,
    string,
    string,
    string
  ];
  let rateStrategies: Record<string, typeof strategyRates> = {};
  let strategyAddresses: Record<string, tEthereumAddress> = {};

  const reserves = Object.entries(reservesParams);

  for (let [symbol, params] of reserves) {
    if (!tokenAddresses[symbol]) {
      console.log(
        `- Skipping init of ${symbol} due token address is not set at markets config`
      );
      continue;
    }
    const { strategy, cTokenImpl, reserveDecimals } = params;
    const {
      optimalUtilizationRate,
      baseVariableBorrowRate,
      variableRateSlope1,
      variableRateSlope2,
    } = strategy;
    if (!strategyAddresses[strategy.name]) {
      // Strategy does not exist, create a new one
      rateStrategies[strategy.name] = [
        addressProvider.address,
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      ];
      strategyAddresses[strategy.name] = await deployRateStrategy(
        strategy.name,
        rateStrategies[strategy.name],
        verify
      );

      // This causes the last strategy to be printed twice, once under "DefaultReserveInterestRateStrategy"
      // and once under the actual `strategyASSET` key.
      rawInsertContractAddressInDb(
        strategy.name,
        strategyAddresses[strategy.name]
      );
    }
    // Prepare input parameters
    reserveSymbols.push(symbol);
    const cTokenImplContractAddr = await getContractAddressWithJsonFallback(
      cTokenImpl,
      poolName
    );
    const debtTokenImplContractAddr = await getContractAddressWithJsonFallback(
      eContractid.DebtToken,
      poolName
    );
    const initParam = {
      cTokenImpl: cTokenImplContractAddr,
      debtTokenImpl: debtTokenImplContractAddr,
      underlyingAssetDecimals: reserveDecimals,
      interestRateAddress: strategyAddresses[strategy.name],
      underlyingAsset: tokenAddresses[symbol],
      treasury: treasuryAddress,
      underlyingAssetName: symbol,
      cTokenName: `${cTokenNamePrefix} ${symbol}`,
      cTokenSymbol: `${cTokenSymbolPrefix}${symbol}`,
      debtTokenName: `${debtTokenNamePrefix} ${symbol}`,
      debtTokenSymbol: `${debtTokenSymbolPrefix}${symbol}`,
    };
    initInputParams.push(initParam);
    //console.log("initInputParams:", symbol, cTokenImpl, initParam);
  }

  // Deploy init reserves per chunks
  const chunkedSymbols = chunk(reserveSymbols, initChunks);
  const chunkedInitInputParams = chunk(initInputParams, initChunks);

  const configurator = await getLendPoolConfiguratorProxy();

  console.log(
    `- Reserves initialization in ${chunkedInitInputParams.length} txs`
  );
  for (
    let chunkIndex = 0;
    chunkIndex < chunkedInitInputParams.length;
    chunkIndex++
  ) {
    console.log("Debug: entered for loop");
    console.log("chunkedInitInputParams[chunkIndex] = ");
    console.info(chunkedInitInputParams[chunkIndex]);
    const tx3 = await waitForTx(
      await configurator.batchInitReserve(chunkedInitInputParams[chunkIndex])
    );
    console.log("Debug: chunkIndex = " + chunkIndex);
    console.log("Debug tx3 = " + tx3);
    console.log(
      `  - Reserve ready for: ${chunkedSymbols[chunkIndex].join(", ")}`,
      chunkedInitInputParams[chunkIndex][0].underlyingAsset
    );
    console.log("    * gasUsed", tx3.gasUsed.toString());
  }
};

export const getCNFTExtraParams = async (
  cNFTName: string,
  nftAddress: tEthereumAddress
) => {
  //console.log(cNFTName);
  switch (cNFTName) {
    default:
      return "0x10";
  }
};

export const initNftsByHelper = async (
  nftsParams: iMultiPoolsNfts<INftParams>,
  nftAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress,
  poolName: ConfigNames,
  verify: boolean
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const cnftRegistry = await addressProvider.getCNFTRegistry();

  // CHUNK CONFIGURATION
  const initChunks = 1;

  // Initialize variables for future nfts initialization
  let nftSymbols: string[] = [];

  let initInputParams: {
    underlyingAsset: string;
  }[] = [];

  const nfts = Object.entries(nftsParams);

  for (let [symbol, params] of nfts) {
    if (!nftAddresses[symbol]) {
      console.log(
        `- Skipping init of ${symbol} due nft address is not set at markets config`
      );
      continue;
    }

    const initParam = {
      underlyingAsset: nftAddresses[symbol],
    };

    // Prepare input parameters
    nftSymbols.push(symbol);
    initInputParams.push(initParam);
  }

  // Deploy init nfts per chunks
  const chunkedSymbols = chunk(nftSymbols, initChunks);
  const chunkedInitInputParams = chunk(initInputParams, initChunks);

  const configurator = await getLendPoolConfiguratorProxy();

  console.log(`- NFTs initialization in ${chunkedInitInputParams.length} txs`);
  for (
    let chunkIndex = 0;
    chunkIndex < chunkedInitInputParams.length;
    chunkIndex++
  ) {
    const tx3 = await waitForTx(
      await configurator.batchInitNft(chunkedInitInputParams[chunkIndex])
    );

    console.log(
      `  - NFT ready for: ${chunkedSymbols[chunkIndex].join(", ")}`,
      chunkedInitInputParams[chunkIndex][0].underlyingAsset
    );
    console.log("    * gasUsed", tx3.gasUsed.toString());
  }
};

export const getPairsTokenAggregator = (
  allAssetsAddresses: {
    [tokenSymbol: string]: tEthereumAddress;
  },
  aggregatorsAddresses: { [tokenSymbol: string]: tEthereumAddress }
): [string[], string[]] => {
  const { ETH, WETH, ...assetsAddressesWithoutEth } = allAssetsAddresses;

  const pairs = Object.entries(assetsAddressesWithoutEth).map(
    ([tokenSymbol, tokenAddress]) => {
      if (tokenSymbol !== "WETH" && tokenSymbol !== "ETH") {
        const aggregatorAddressIndex = Object.keys(
          aggregatorsAddresses
        ).findIndex((value) => value === tokenSymbol);
        const [, aggregatorAddress] = (
          Object.entries(aggregatorsAddresses) as [string, tEthereumAddress][]
        )[aggregatorAddressIndex];
        return [tokenAddress, aggregatorAddress];
      }
    }
  ) as [string, string][];

  const mappedPairs = pairs.map(([asset]) => asset);
  const mappedAggregators = pairs.map(([, source]) => source);

  return [mappedPairs, mappedAggregators];
};

export const configureReservesByHelper = async (
  reservesParams: iMultiPoolsAssets<IReserveParams>,
  tokenAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const configuator = await getLendPoolConfiguratorProxy();
  const tokens: string[] = [];
  const symbols: string[] = [];

  console.log("addressesProvider:", addressProvider.address);
  console.log("configuator:", configuator.address);

  const inputParams: {
    asset: string;
    reserveFactor: BigNumberish;
  }[] = [];

  const assetsParams: string[] = [];

  console.log(`- Configure Reserves`);
  for (const [
    assetSymbol,
    { reserveFactor, borrowingEnabled },
  ] of Object.entries(reservesParams) as [string, IReserveParams][]) {
    if (!tokenAddresses[assetSymbol]) {
      console.log(
        `- Skipping init of ${assetSymbol} due token address is not set at markets config`
      );
      continue;
    }

    const assetAddressIndex = Object.keys(tokenAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, tokenAddress] = (
      Object.entries(tokenAddresses) as [string, string][]
    )[assetAddressIndex];
    // Push data
    if (borrowingEnabled) {
      assetsParams.push(tokenAddress);
    }

    inputParams.push({
      asset: tokenAddress,
      reserveFactor: reserveFactor,
    });

    tokens.push(tokenAddress);
    symbols.push(assetSymbol);

    console.log(
      `  - Params for ${assetSymbol}:`,
      reserveFactor,
      borrowingEnabled
    );
  }
  if (tokens.length) {
    // Deploy init per chunks
    const enableChunks = 20;
    const chunkedSymbols = chunk(symbols, enableChunks);
    const chunkedInputParams = chunk(inputParams, enableChunks);

    console.log(`- Configure reserves in ${chunkedInputParams.length} txs`);
    for (
      let chunkIndex = 0;
      chunkIndex < chunkedInputParams.length;
      chunkIndex++
    ) {
      await waitForTx(
        await configuator.batchConfigReserve(chunkedInputParams[chunkIndex])
      );
      console.log(
        `  - batchConfigReserve for: ${chunkedSymbols[chunkIndex].join(", ")}`
      );
    }

    await waitForTx(
      await configuator.setBorrowingFlagOnReserve(assetsParams, true)
    );
  }
};

export const configureNftsByHelper = async (
  nftsParams: iMultiPoolsNfts<INftParams>,
  nftAddresses: { [symbol: string]: tEthereumAddress },
  admin: tEthereumAddress
) => {
  const addressProvider = await getLendPoolAddressesProvider();
  const configuator = await getLendPoolConfiguratorProxy();
  const tokens: string[] = [];
  const symbols: string[] = [];

  console.log("addressesProvider:", addressProvider.address);
  console.log("configuator:", configuator.address);

  const inputParams: {
    asset: string;
    baseLTV: BigNumberish;
    liquidationThreshold: BigNumberish;
    liquidationBonus: BigNumberish;
    redeemDuration: BigNumberish;
    buyItNowDuration: BigNumberish;
    redeemFine: BigNumberish;
    redeemThreshold: BigNumberish;
    minBuyItNowFine: BigNumberish;
  }[] = [];

  console.log(`- Configure NFTs`);
  for (const [
    assetSymbol,
    {
      baseLTVAsCollateral,
      liquidationBonus,
      liquidationThreshold,
      redeemDuration,
      buyItNowDuration,
      redeemFine,
      redeemThreshold,
      minBuyItNowFine,
    },
  ] of Object.entries(nftsParams) as [string, INftParams][]) {
    if (!nftAddresses[assetSymbol]) {
      console.log(
        `- Skipping init of ${assetSymbol} due nft address is not set at markets config`
      );
      continue;
    }
    if (baseLTVAsCollateral === "-1") continue;

    const assetAddressIndex = Object.keys(nftAddresses).findIndex(
      (value) => value === assetSymbol
    );
    const [, tokenAddress] = (
      Object.entries(nftAddresses) as [string, string][]
    )[assetAddressIndex];
    // Push data

    inputParams.push({
      asset: tokenAddress,
      baseLTV: baseLTVAsCollateral,
      liquidationThreshold: liquidationThreshold,
      liquidationBonus: liquidationBonus,
      redeemDuration: redeemDuration,
      buyItNowDuration: buyItNowDuration,
      redeemFine: redeemFine,
      redeemThreshold: redeemThreshold,
      minBuyItNowFine: minBuyItNowFine,
    });

    tokens.push(tokenAddress);
    symbols.push(assetSymbol);

    console.log(
      `  - Params for ${assetSymbol}:`,
      baseLTVAsCollateral,
      liquidationThreshold,
      liquidationBonus,
      redeemDuration,
      buyItNowDuration,
      redeemFine,
      redeemThreshold,
      minBuyItNowFine
    );
  }
  if (tokens.length) {
    // Deploy init per chunks
    const enableChunks = 20;
    const chunkedSymbols = chunk(symbols, enableChunks);
    const chunkedInputParams = chunk(inputParams, enableChunks);

    console.log(`- Configure NFTs in ${chunkedInputParams.length} txs`);
    for (
      let chunkIndex = 0;
      chunkIndex < chunkedInputParams.length;
      chunkIndex++
    ) {
      //console.log("configureNfts:", chunkedInputParams[chunkIndex]);
      await waitForTx(
        await configuator.batchConfigNft(chunkedInputParams[chunkIndex])
      );
      console.log(
        `  - batchConfigNft for: ${chunkedSymbols[chunkIndex].join(", ")}`
      );
    }
  }
};
