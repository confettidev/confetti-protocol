import rawBRE from "hardhat";
import { MockContract } from "ethereum-waffle";
import "./helpers/utils/math";
import {
  insertContractAddressInDb,
  registerContractInJsonDb,
} from "../helpers/contracts-helpers";
import {
  deployLendPoolAddressesProvider,
  deployCTokenImplementations,
  deployLendPoolConfigurator,
  deployLendPool,
  deployLendPoolLoan,
  deployReserveOracle,
  deployNFTOracle,
  deployMockNFTOracle,
  deployMockReserveOracle,
  deployWalletBalancerProvider,
  deployConfettiProtocolDataProvider,
  deployWETHGateway,
  deployCNFTRegistry,
  deployPunkGateway,
  deployConfettiUpgradeableProxy,
  deployConfettiProxyAdmin,
  deployGenericCNFTImpl,
  deployLendPoolAddressesProviderRegistry,
  deployMockIncentivesController,
  deployAllMockTokens,
  deployAllMockNfts,
  deployUiPoolDataProvider,
  deployMockChainlinkOracle,
  deployConfettiLibraries,
} from "../helpers/contracts-deployments";
import { Signer } from "ethers";
import { eContractid, tEthereumAddress, ConfettiPools } from "../helpers/types";
import { MintableERC20 } from "../types/MintableERC20";
import { MintableERC721 } from "../types/MintableERC721";
import {
  ConfigNames,
  getTreasuryAddress,
  loadPoolConfig,
} from "../helpers/configuration";
import { initializeMakeSuite } from "./helpers/make-suite";

import {
  setAggregatorsInReserveOracle,
  addAssetsInNFTOracle,
  setPricesInNFTOracle,
  deployAllChainlinkMockAggregators,
  deployChainlinkMockAggregator,
} from "../helpers/oracles-helpers";
import { DRE, waitForTx } from "../helpers/misc-utils";
import {
  initReservesByHelper,
  configureReservesByHelper,
  initNftsByHelper,
  configureNftsByHelper,
} from "../helpers/init-helpers";
import ConfettiConfig from "../markets/confetti";
import {
  getSecondSigner,
  getDeploySigner,
  getPoolAdminSigner,
  getEmergencyAdminSigner,
  getLendPool,
  getLendPoolConfiguratorProxy,
  getLendPoolLoanProxy,
  getCNFTRegistryProxy,
  getCryptoPunksMarket,
  getWrappedPunk,
  getWETHGateway,
  getPunkGateway,
} from "../helpers/contracts-getters";
import { WETH9Mocked } from "../types/WETH9Mocked";
import { getNftAddressFromSymbol } from "./helpers/utils/helpers";
import { WrappedPunk } from "../types/WrappedPunk";
import {
  ADDRESS_ID_PUNK_GATEWAY,
  ADDRESS_ID_WETH_GATEWAY,
} from "../helpers/constants";
import { WETH9 } from "../types";

const MOCK_USD_PRICE = ConfettiConfig.ProtocolGlobalParams.MockUsdPrice;
const ALL_ASSETS_INITIAL_PRICES = ConfettiConfig.Mocks.AllAssetsInitialPrices;
const USD_ADDRESS = ConfettiConfig.ProtocolGlobalParams.UsdAddress;

const ALL_NFTS_INITIAL_PRICES = ConfettiConfig.Mocks.AllNftsInitialPrices;

const buildTestEnv = async (deployer: Signer, secondaryWallet: Signer) => {
  console.time("setup");

  const poolAdmin = "0xCe7DA2634fF47036225456E507208Dbe8873F82F";
  const emergencyAdmin = "0xCe7DA2634fF47036225456E507208Dbe8873F82F";
  console.log(
    "Admin accounts:",
    "poolAdmin:",
    poolAdmin,
    "emergencyAdmin:",
    emergencyAdmin
  );

  const config = loadPoolConfig(ConfigNames.Confetti);

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock external ERC20 Tokens, such as WETH, DAI...");
  const mockTokens: {
    [symbol: string]: MockContract | MintableERC20 | WETH9Mocked | WETH9;
  } = {
    ...(await deployAllMockTokens(true)),
  };

  console.log("-> Prepare mock external ERC721 NFTs, such as WPUNKS, BAYC...");
  const mockNfts: {
    [symbol: string]: MockContract | MintableERC721 | WrappedPunk;
  } = {
    ...(await deployAllMockNfts(false)),
  };
  const cryptoPunksMarket = await getCryptoPunksMarket();
  await waitForTx(await cryptoPunksMarket.allInitialOwnersAssigned());
  const wrappedPunk = await getWrappedPunk();

  console.log("-> Prepare mock external IncentivesController...");
  const mockIncentivesController = await deployMockIncentivesController();
  const incentivesControllerAddress = mockIncentivesController.address;

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare proxy admin...");
  const confettiProxyAdmin = await deployConfettiProxyAdmin(
    eContractid.ConfettiProxyAdminTest
  );
  console.log("confettiProxyAdmin:", confettiProxyAdmin.address);

  //////////////////////////////////////////////////////////////////////////////
  // !!! MUST BEFORE LendPoolConfigurator which will getCNFTRegistry from address provider when init
  console.log("-> Prepare mock cnft registry...");
  const cnftGenericImpl = await deployGenericCNFTImpl(false);

  const cnftRegistryImpl = await deployCNFTRegistry();
  const initEncodedData = cnftRegistryImpl.interface.encodeFunctionData(
    "initialize",
    [
      cnftGenericImpl.address,
      config.Mocks.CNFTNamePrefix,
      config.Mocks.CNFTSymbolPrefix,
    ]
  );

  const cnftRegistryProxy = await deployConfettiUpgradeableProxy(
    eContractid.CNFTRegistry,
    confettiProxyAdmin.address,
    cnftRegistryImpl.address,
    initEncodedData
  );

  const cnftRegistry = await getCNFTRegistryProxy(cnftRegistryProxy.address);

  await waitForTx(await cnftRegistry.transferOwnership(poolAdmin));

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock cnft tokens...");
  for (const [nftSymbol, mockedNft] of Object.entries(mockNfts) as [
    string,
    MintableERC721
  ][]) {
    await waitForTx(await cnftRegistry.createCNFT(mockedNft.address));
    const cnftAddresses = await cnftRegistry.getCNFTAddresses(
      mockedNft.address
    );
    console.log(
      "createCNFT:",
      nftSymbol,
      cnftAddresses.cNFTProxy,
      cnftAddresses.cNFTImpl
    );
  }

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare address provider...");
  const addressesProviderRegistry =
    await deployLendPoolAddressesProviderRegistry();

  const addressesProvider = await deployLendPoolAddressesProvider(
    ConfettiConfig.MarketId
  );
  await waitForTx(await addressesProvider.setPoolAdmin(poolAdmin));
  await waitForTx(await addressesProvider.setEmergencyAdmin(emergencyAdmin));

  await waitForTx(
    await addressesProviderRegistry.registerAddressesProvider(
      addressesProvider.address,
      ConfettiConfig.ProviderId
    )
  );

  //////////////////////////////////////////////////////////////////////////////
  // !!! MUST BEFORE LendPoolConfigurator which will getCNFTRegistry from address provider when init
  await waitForTx(
    await addressesProvider.setCNFTRegistry(cnftRegistry.address)
  );
  await waitForTx(
    await addressesProvider.setIncentivesController(incentivesControllerAddress)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare confetti libraries...");
  await deployConfettiLibraries();

  console.log("-> Prepare lend pool...");
  const lendPoolImpl = await deployLendPool();
  await waitForTx(
    await addressesProvider.setLendPoolImpl(lendPoolImpl.address, [])
  );
  // configurator will create proxy for implement
  const lendPoolAddress = await addressesProvider.getLendPool();
  const lendPoolProxy = await getLendPool(lendPoolAddress);

  await insertContractAddressInDb(eContractid.LendPool, lendPoolProxy.address);

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare lend pool loan...");
  const lendPoolLoanImpl = await deployLendPoolLoan();
  await waitForTx(
    await addressesProvider.setLendPoolLoanImpl(lendPoolLoanImpl.address, [])
  );
  // configurator will create proxy for implement
  const lendPoolLoanProxy = await getLendPoolLoanProxy(
    await addressesProvider.getLendPoolLoan()
  );
  await insertContractAddressInDb(
    eContractid.LendPoolLoan,
    lendPoolLoanProxy.address
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare pool configurator...");
  const lendPoolConfiguratorImpl = await deployLendPoolConfigurator();
  await waitForTx(
    await addressesProvider.setLendPoolConfiguratorImpl(
      lendPoolConfiguratorImpl.address,
      []
    )
  );
  // configurator will create proxy for implement
  const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
    await addressesProvider.getLendPoolConfigurator()
  );
  await insertContractAddressInDb(
    eContractid.LendPoolConfigurator,
    lendPoolConfiguratorProxy.address
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock reserve token aggregators...");
  const allTokenDecimals = Object.entries(config.ReservesConfig).reduce(
    (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenConfig]) => ({
      ...accum,
      [tokenSymbol]: tokenConfig.reserveDecimals,
    }),
    {}
  );
  const mockAggregators = await deployAllChainlinkMockAggregators(
    allTokenDecimals,
    ALL_ASSETS_INITIAL_PRICES
  );
  const usdMockAggregator = await deployChainlinkMockAggregator(
    "USD",
    "8",
    MOCK_USD_PRICE
  );
  const allTokenAddresses = Object.entries(mockTokens).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, tokenContract]
    ) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {
      USD: USD_ADDRESS,
    }
  );
  const allAggregatorsAddresses = Object.entries(mockAggregators).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, aggregator]
    ) => ({
      ...accum,
      [tokenSymbol]: aggregator.address,
    }),
    {
      USD: usdMockAggregator.address,
    }
  );
  await deployMockChainlinkOracle("18", false); // Dummy aggregator for test

  console.log("-> Prepare reserve oracle...");
  const reserveOracleImpl = await deployReserveOracle([
    //mockTokens.WETH.address
  ]);
  await waitForTx(await reserveOracleImpl.initialize(mockTokens.WETH.address));
  await waitForTx(
    await addressesProvider.setReserveOracle(reserveOracleImpl.address)
  );
  await setAggregatorsInReserveOracle(
    allTokenAddresses,
    allAggregatorsAddresses,
    reserveOracleImpl
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock reserve oracle...");
  const mockReserveOracleImpl = await deployMockReserveOracle([]);
  await waitForTx(
    await mockReserveOracleImpl.initialize(mockTokens.WETH.address)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare mock NFT token aggregators...");
  const allNftAddresses = Object.entries(mockNfts).reduce(
    (
      accum: { [tokenSymbol: string]: tEthereumAddress },
      [tokenSymbol, tokenContract]
    ) => ({
      ...accum,
      [tokenSymbol]: tokenContract.address,
    }),
    {}
  );
  const allNftPrices = Object.entries(ALL_NFTS_INITIAL_PRICES).reduce(
    (accum: { [tokenSymbol: string]: string }, [tokenSymbol, tokenPrice]) => ({
      ...accum,
      [tokenSymbol]: tokenPrice,
    }),
    {}
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare nft oracle...");
  const nftOracleImpl = await deployNFTOracle();
  await waitForTx(
    await nftOracleImpl.initialize(
      await addressesProvider.getPoolAdmin(),
      "20000000000000000000",
      "10000000000000000000",
      1,
      1,
      100
    )
  );
  await waitForTx(await addressesProvider.setNFTOracle(nftOracleImpl.address));
  await addAssetsInNFTOracle(allNftAddresses, nftOracleImpl);
  await setPricesInNFTOracle(allNftPrices, allNftAddresses, nftOracleImpl);

  console.log("-> Prepare mock nft oracle...");
  const mockNftOracleImpl = await deployMockNFTOracle();
  await waitForTx(
    await mockNftOracleImpl.initialize(
      await addressesProvider.getPoolAdmin(),
      "20000000000000000000",
      "10000000000000000000",
      1,
      1,
      100
    )
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare Reserve pool...");
  const { ...tokensAddressesWithoutUsd } = allTokenAddresses;
  const allReservesAddresses = {
    ...tokensAddressesWithoutUsd,
  };

  // Reserve params from pool + mocked tokens
  const reservesParams = {
    ...config.ReservesConfig,
  };

  console.log("-> Prepare CToken impl contract...");
  await deployCTokenImplementations(
    ConfigNames.Confetti,
    reservesParams,
    false
  );

  console.log("-> Prepare Reserve init and configure...");
  const {
    CTokenNamePrefix,
    CTokenSymbolPrefix,
    DebtTokenNamePrefix,
    DebtTokenSymbolPrefix,
  } = config;
  const treasuryAddress = await getTreasuryAddress(config);

  await initReservesByHelper(
    reservesParams,
    allReservesAddresses,
    CTokenNamePrefix,
    CTokenSymbolPrefix,
    DebtTokenNamePrefix,
    DebtTokenSymbolPrefix,
    poolAdmin,
    treasuryAddress,
    ConfigNames.Confetti,
    false
  );

  await configureReservesByHelper(
    reservesParams,
    allReservesAddresses,
    poolAdmin
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare NFT pools...");
  const allNftsAddresses = {
    ...allNftAddresses,
  };

  // NFT params from pool + mocked tokens
  const nftsParams = {
    ...config.NftsConfig,
  };

  console.log("-> Prepare NFT init and configure...");
  await initNftsByHelper(
    nftsParams,
    allNftsAddresses,
    poolAdmin,
    ConfigNames.Confetti,
    false
  );

  await configureNftsByHelper(nftsParams, allNftsAddresses, poolAdmin);

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare wallet & data & ui provider...");
  const walletProvider = await deployWalletBalancerProvider();
  await waitForTx(
    await addressesProvider.setWalletBalanceProvider(walletProvider.address)
  );

  const confettiDataProvider = await deployConfettiProtocolDataProvider(
    addressesProvider.address
  );
  await waitForTx(
    await addressesProvider.setConfettiDataProvider(
      confettiDataProvider.address
    )
  );

  const uiDataProvider = await deployUiPoolDataProvider(
    reserveOracleImpl.address,
    nftOracleImpl.address,
    false
  );
  await waitForTx(
    await addressesProvider.setUIDataProvider(uiDataProvider.address)
  );

  //////////////////////////////////////////////////////////////////////////////
  console.log("-> Prepare WETH gateway...");
  const wethGatewayImpl = await deployWETHGateway();
  const wethGwInitEncodedData = wethGatewayImpl.interface.encodeFunctionData(
    "initialize",
    [addressesProvider.address, mockTokens.WETH.address]
  );
  const wethGatewayProxy = await deployConfettiUpgradeableProxy(
    eContractid.WETHGateway,
    confettiProxyAdmin.address,
    wethGatewayImpl.address,
    wethGwInitEncodedData
  );
  await waitForTx(
    await addressesProvider.setAddress(
      ADDRESS_ID_WETH_GATEWAY,
      wethGatewayProxy.address
    )
  );
  const wethGateway = await getWETHGateway(
    await addressesProvider.getAddress(ADDRESS_ID_WETH_GATEWAY)
  );
  await waitForTx(
    await wethGateway.authorizeLendPoolNFT([
      allNftsAddresses.BAYC,
      allNftsAddresses.WPUNKS,
    ])
  );
  await insertContractAddressInDb(eContractid.WETHGateway, wethGateway.address);

  // console.log("-> Prepare PUNK gateway...");
  // const punkGatewayImpl = await deployPunkGateway();
  // const punkGwInitEncodedData = punkGatewayImpl.interface.encodeFunctionData("initialize", [
  //   addressesProvider.address,
  //   wethGateway.address,
  //   cryptoPunksMarket.address,
  //   wrappedPunk.address,
  // ]);
  // const punkGatewayProxy = await deployConfettiUpgradeableProxy(
  //   eContractid.PunkGateway,
  //   confettiProxyAdmin.address,
  //   punkGatewayImpl.address,
  //   punkGwInitEncodedData
  // );
  // await waitForTx(await addressesProvider.setAddress(ADDRESS_ID_PUNK_GATEWAY, punkGatewayProxy.address));
  // const punkGateway = await getPunkGateway(await addressesProvider.getAddress(ADDRESS_ID_PUNK_GATEWAY));
  // await waitForTx(
  //   await punkGateway.authorizeLendPoolERC20([
  //     allReservesAddresses.WETH,
  //     allReservesAddresses.DAI,
  //     allReservesAddresses.USDC,
  //   ])
  // );
  // await insertContractAddressInDb(eContractid.PunkGateway, punkGateway.address);

  // await waitForTx(await wethGateway.authorizeCallerWhitelist([punkGateway.address], true));

  console.timeEnd("setup");
};

before(async () => {
  await rawBRE.run("set-DRE");
  const deployer = await getDeploySigner();
  const secondaryWallet = await getSecondSigner();
  const FORK = process.env.FORK;

  if (FORK) {
    await rawBRE.run("confetti:mainnet", { skipRegistry: true });
  } else {
    console.log("-> Begin deploying test environment...");
    // await buildTestEnv(deployer, secondaryWallet);
    // console.log("\n\nDeploy proxy admin");
    // await DRE.run("full:deploy-proxy-admin", { pool: "Confetti" });
    // console.log("\n\nDeploy remaining test environment");
    // await DRE.run("full:deploy-address-provider", {
    //   pool: "Confetti",
    //   skipRegistry: true,
    // });
    console.log("\n\nDeploy confetti collector");
    await DRE.run("full:deploy-confetti-collector", { pool: "Confetti" });
    // console.log("\n\nDeploy address provider");
  }

  console.log("-> Initialize make suite...");
  await initializeMakeSuite();

  console.log("\n***************");
  console.log("Setup and snapshot finished");
  console.log("***************\n");
});
