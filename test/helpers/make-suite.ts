import {
  evmRevert,
  evmSnapshot,
  DRE,
  getNowTimeInSeconds,
} from "../../helpers/misc-utils";
import { Signer } from "ethers";
import {
  getLendPool,
  getLendPoolAddressesProvider,
  getConfettiProtocolDataProvider,
  getCToken,
  getCNFT,
  getMintableERC20,
  getMintableERC721,
  getLendPoolConfiguratorProxy,
  getReserveOracle,
  getNFTOracle,
  getWETHMocked,
  getWETHGateway,
  getCNFTRegistryProxy,
  getLendPoolLoanProxy,
  getCryptoPunksMarket,
  getWrappedPunk,
  getPunkGateway,
  getMockChainlinkOracle,
  getMockNFTOracle,
  getMockReserveOracle,
  getMockIncentivesController,
  getDebtToken,
  getWalletProvider,
  getUIPoolDataProvider,
} from "../../helpers/contracts-getters";
import {
  eEthereumNetwork,
  eNetwork,
  tEthereumAddress,
} from "../../helpers/types";
import { LendPool } from "../../types/LendPool";
import { ConfettiProtocolDataProvider } from "../../types/ConfettiProtocolDataProvider";
import { MintableERC20 } from "../../types/MintableERC20";
import { CToken } from "../../types/CToken";
import { MintableERC721 } from "../../types/MintableERC721";
import { CNFT } from "../../types/CNFT";
import { LendPoolConfigurator } from "../../types/LendPoolConfigurator";

import chai from "chai";
// @ts-ignore
import bignumberChai from "chai-bignumber";
import { almostEqual } from "./almost-equal";
import { ReserveOracle } from "../../types/ReserveOracle";
import { NFTOracle } from "../../types/NFTOracle";
import { MockNFTOracle } from "../../types/MockNFTOracle";
import { MockReserveOracle } from "../../types/MockReserveOracle";
import { LendPoolAddressesProvider } from "../../types/LendPoolAddressesProvider";
import { getEthersSigners } from "../../helpers/contracts-helpers";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { WETH9Mocked } from "../../types/WETH9Mocked";
import { WETHGateway } from "../../types/WETHGateway";
import { solidity } from "ethereum-waffle";
import { ConfettiConfig } from "../../markets/confetti";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  CNFTRegistry,
  LendPoolLoan,
  CryptoPunksMarket,
  WrappedPunk,
  PunkGateway,
  MockIncentivesController,
  UiPoolDataProvider,
  WalletBalanceProvider,
} from "../../types";
import { MockChainlinkOracle } from "../../types/MockChainlinkOracle";
import { USD_ADDRESS } from "../../helpers/constants";

chai.use(bignumberChai());
chai.use(almostEqual());
chai.use(solidity);

export interface SignerWithAddress {
  signer: Signer;
  address: tEthereumAddress;
}
export interface TestEnv {
  deployer: SignerWithAddress;
  users: SignerWithAddress[];
  cnftRegistry: CNFTRegistry;
  pool: LendPool;
  loan: LendPoolLoan;
  configurator: LendPoolConfigurator;
  reserveOracle: ReserveOracle;
  mockChainlinkOracle: MockChainlinkOracle;
  mockReserveOracle: MockReserveOracle;
  nftOracle: NFTOracle;
  mockNftOracle: MockNFTOracle;
  dataProvider: ConfettiProtocolDataProvider;
  uiProvider: UiPoolDataProvider;
  walletProvider: WalletBalanceProvider;
  mockIncentivesController: MockIncentivesController;
  weth: WETH9Mocked;
  bWETH: CToken;
  dai: MintableERC20;
  bDai: CToken;
  usdc: MintableERC20;
  bUsdc: CToken;
  //wpunks: WPUNKSMocked;
  bPUNK: CNFT;
  bayc: MintableERC721;
  bBAYC: CNFT;
  addressesProvider: LendPoolAddressesProvider;
  wethGateway: WETHGateway;
  tokenIdTracker: number;

  cryptoPunksMarket: CryptoPunksMarket;
  punkIndexTracker: number;
  wrappedPunk: WrappedPunk;
  punkGateway: PunkGateway;

  roundIdTracker: number;
  nowTimeTracker: number;
}

let buidlerevmSnapshotId: string = "0x1";
const setBuidlerevmSnapshotId = (id: string) => {
  buidlerevmSnapshotId = id;
};

const testEnv: TestEnv = {
  deployer: {} as SignerWithAddress,
  users: [] as SignerWithAddress[],
  cnftRegistry: {} as CNFTRegistry,
  pool: {} as LendPool,
  loan: {} as LendPoolLoan,
  configurator: {} as LendPoolConfigurator,
  dataProvider: {} as ConfettiProtocolDataProvider,
  uiProvider: {} as UiPoolDataProvider,
  walletProvider: {} as WalletBalanceProvider,
  mockIncentivesController: {} as MockIncentivesController,
  reserveOracle: {} as ReserveOracle,
  mockReserveOracle: {} as MockReserveOracle,
  mockNftOracle: {} as MockNFTOracle,
  nftOracle: {} as NFTOracle,
  mockChainlinkOracle: {} as MockChainlinkOracle,
  weth: {} as WETH9Mocked,
  bWETH: {} as CToken,
  dai: {} as MintableERC20,
  bDai: {} as CToken,
  usdc: {} as MintableERC20,
  bUsdc: {} as CToken,
  //wpunks: WPUNKSMocked,
  bPUNK: {} as CNFT,
  bayc: {} as MintableERC721,
  bBAYC: {} as CNFT,
  addressesProvider: {} as LendPoolAddressesProvider,
  wethGateway: {} as WETHGateway,
  //wpunksGateway: {} as WPUNKSGateway,
  tokenIdTracker: {} as number,
  roundIdTracker: {} as number,
  nowTimeTracker: {} as number,
} as TestEnv;

export async function initializeMakeSuite() {
  console.log("10");
  const [_deployer, ...restSigners] = await getEthersSigners();
  console.log("11");
  const deployer: SignerWithAddress = {
    address: await _deployer.getAddress(),
    signer: _deployer,
  };
  console.log("12");
  for (const signer of restSigners) {
    testEnv.users.push({
      signer,
      address: await signer.getAddress(),
    });
  }
  testEnv.deployer = deployer;
  console.log("13");
  testEnv.cnftRegistry = await getCNFTRegistryProxy();
  console.log("14");
  testEnv.pool = await getLendPool();
  console.log("15");
  testEnv.loan = await getLendPoolLoanProxy();
  console.log("16");
  testEnv.configurator = await getLendPoolConfiguratorProxy();
  console.log("17");
  testEnv.addressesProvider = await getLendPoolAddressesProvider();
  console.log("18");
  testEnv.reserveOracle = await getReserveOracle();
  testEnv.mockChainlinkOracle = await getMockChainlinkOracle();
  testEnv.mockReserveOracle = await getMockReserveOracle();
  testEnv.nftOracle = await getNFTOracle();
  testEnv.mockNftOracle = await getMockNFTOracle();

  testEnv.dataProvider = await getConfettiProtocolDataProvider();
  testEnv.walletProvider = await getWalletProvider();
  testEnv.uiProvider = await getUIPoolDataProvider();

  testEnv.mockIncentivesController = await getMockIncentivesController();

  // Reserve Tokens
  const allReserveTokens =
    await testEnv.dataProvider.getAllReservesTokenDatas();
  // const bDaiAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "DAI")?.cTokenAddress;
  // const bUsdcAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "USDC")?.cTokenAddress;
  const bWEthAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "WETH"
  )?.cTokenAddress;

  // const daiAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "DAI")?.tokenAddress;
  // const usdcAddress = allReserveTokens.find((tokenData) => tokenData.tokenSymbol === "USDC")?.tokenAddress;
  const wethAddress = allReserveTokens.find(
    (tokenData) => tokenData.tokenSymbol === "WETH"
  )?.tokenAddress;

  if (!bWEthAddress) {
    console.error("Invalid CTokens", bWEthAddress);
    process.exit(1);
  }
  if (!wethAddress) {
    console.error("Invalid Reserve Tokens", wethAddress);
    process.exit(1);
  }

  // testEnv.bDai = await getCToken(bDaiAddress);
  // testEnv.bUsdc = await getCToken(bUsdcAddress);
  testEnv.bWETH = await getCToken(bWEthAddress);

  // testEnv.dai = await getMintableERC20(daiAddress);
  // testEnv.usdc = await getMintableERC20(usdcAddress);
  testEnv.weth = await getWETHMocked(wethAddress);
  testEnv.wethGateway = await getWETHGateway();

  // NFT Tokens
  const allCNFTTokens = await testEnv.dataProvider.getAllNftsTokenDatas();
  //console.log("allCNFTTokens", allCNFTTokens);
  const bPunkAddress = allCNFTTokens.find(
    (tokenData) => tokenData.nftSymbol === "WPUNKS"
  )?.cNFTAddress;
  const bByacAddress = allCNFTTokens.find(
    (tokenData) => tokenData.nftSymbol === "BAYC"
  )?.cNFTAddress;

  const wpunksAddress = allCNFTTokens.find(
    (tokenData) => tokenData.nftSymbol === "WPUNKS"
  )?.nftAddress;
  const baycAddress = allCNFTTokens.find(
    (tokenData) => tokenData.nftSymbol === "BAYC"
  )?.nftAddress;

  if (!bByacAddress || !bPunkAddress) {
    console.error("Invalid CNFT Tokens", bByacAddress, bPunkAddress);
    process.exit(1);
  }
  if (!baycAddress || !wpunksAddress) {
    console.error("Invalid NFT Tokens", baycAddress, wpunksAddress);
    process.exit(1);
  }

  testEnv.bBAYC = await getCNFT(bByacAddress);
  testEnv.bPUNK = await getCNFT(bPunkAddress);

  testEnv.bayc = await getMintableERC721(baycAddress);

  testEnv.cryptoPunksMarket = await getCryptoPunksMarket();
  testEnv.wrappedPunk = await getWrappedPunk();
  testEnv.punkGateway = await getPunkGateway();

  testEnv.tokenIdTracker = 100;
  testEnv.punkIndexTracker = 0;

  testEnv.roundIdTracker = 1;
  testEnv.nowTimeTracker = Number(await getNowTimeInSeconds());
}

const setSnapshot = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  setBuidlerevmSnapshotId(await evmSnapshot());
};

const revertHead = async () => {
  const hre = DRE as HardhatRuntimeEnvironment;
  await evmRevert(buidlerevmSnapshotId);
};

export function makeSuite(name: string, tests: (testEnv: TestEnv) => void) {
  describe(name, () => {
    before(async () => {
      await setSnapshot();
    });
    tests(testEnv);
    after(async () => {
      await revertHead();
    });
  });
}
