import { task } from "hardhat/config";
import {
  getEthersSignerByAddress,
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import {
  deployCTokenImplementations,
  deployLendPool,
  deployLendPoolLoan,
  deployLendPoolConfigurator,
  deployConfettiLibraries,
} from "../../helpers/contracts-deployments";
import { eContractid, eNetwork } from "../../helpers/types";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import {
  getLendPoolAddressesProvider,
  getLendPool,
  getLendPoolLoanProxy,
  getLendPoolConfiguratorProxy,
  getCNFTRegistryProxy,
} from "../../helpers/contracts-getters";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import {
  loadPoolConfig,
  ConfigNames,
  getGenesisPoolAdmin,
  getEmergencyAdmin,
} from "../../helpers/configuration";

task("full:deploy-lend-pool", "Deploy lend pool for full enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, DRE: HardhatRuntimeEnvironment) => {
    try {
      await DRE.run("set-DRE");
      const network = <eNetwork>DRE.network.name;
      const poolConfig = loadPoolConfig(pool);
      const addressesProvider = await getLendPoolAddressesProvider();

      //////////////////////////////////////////////////////////////////////////
      const cnftRegistryAddress = getParamPerNetwork(
        poolConfig.CNFTRegistry,
        network
      );
      console.log("CNFTRegistry", poolConfig.CNFTRegistry);
      if (
        cnftRegistryAddress == undefined ||
        !notFalsyOrZeroAddress(cnftRegistryAddress)
      ) {
        throw Error("Invalid CNFT Registry address in pool config");
      }
      const cnftRegistryProxy = await getCNFTRegistryProxy(cnftRegistryAddress);
      console.log("Setting CNFTRegistry to address provider...");
      await waitForTx(
        await addressesProvider.setCNFTRegistry(cnftRegistryProxy.address)
      );

      // Reserves Init & NFTs Init need IncentivesController
      const incentivesControllerAddress = getParamPerNetwork(
        poolConfig.IncentivesController,
        network
      );
      console.log("IncentivesController", poolConfig.IncentivesController);
      if (
        incentivesControllerAddress == undefined ||
        !notFalsyOrZeroAddress(incentivesControllerAddress)
      ) {
        throw Error("Invalid IncentivesController address in pool config");
      }
      console.log("Setting IncentivesController to address provider...");
      await waitForTx(
        await addressesProvider.setIncentivesController(
          incentivesControllerAddress
        )
      );

      //////////////////////////////////////////////////////////////////////////
      console.log("Deploying new libraries implementation...");
      await deployConfettiLibraries(verify);

      // Reuse/deploy lend pool implementation
      console.log("Deploying new lend pool implementation & libraries...");
      const lendPoolImpl = await deployLendPool(verify);
      console.log(
        "Setting lend pool implementation with address:",
        lendPoolImpl.address
      );
      // Set lending pool impl to Address provider
      await waitForTx(
        await addressesProvider.setLendPoolImpl(lendPoolImpl.address, [])
      );

      const address = await addressesProvider.getLendPool();
      const lendPoolProxy = await getLendPool(address);

      await insertContractAddressInDb(
        eContractid.LendPool,
        lendPoolProxy.address
      );

      //////////////////////////////////////////////////////////////////////////
      // Reuse/deploy lend pool loan
      console.log("Deploying new loan implementation...");
      const lendPoolLoanImpl = await deployLendPoolLoan(verify);
      console.log(
        "Setting lend pool loan implementation with address:",
        lendPoolLoanImpl.address
      );
      // Set lend pool conf impl to Address Provider
      await waitForTx(
        await addressesProvider.setLendPoolLoanImpl(
          lendPoolLoanImpl.address,
          []
        )
      );

      const lendPoolLoanProxy = await getLendPoolLoanProxy(
        await addressesProvider.getLendPoolLoan()
      );

      await insertContractAddressInDb(
        eContractid.LendPoolLoan,
        lendPoolLoanProxy.address
      );

      //////////////////////////////////////////////////////////////////////////
      // Reuse/deploy lend pool configurator
      console.log("Deploying new configurator implementation...");
      const lendPoolConfiguratorImpl = await deployLendPoolConfigurator(verify);
      console.log(
        "Setting lend pool configurator implementation with address:",
        lendPoolConfiguratorImpl.address
      );
      // Set lend pool conf impl to Address Provider
      await waitForTx(
        await addressesProvider.setLendPoolConfiguratorImpl(
          lendPoolConfiguratorImpl.address,
          []
        )
      );

      const lendPoolConfiguratorProxy = await getLendPoolConfiguratorProxy(
        await addressesProvider.getLendPoolConfigurator()
      );

      await insertContractAddressInDb(
        eContractid.LendPoolConfigurator,
        lendPoolConfiguratorProxy.address
      );

      //////////////////////////////////////////////////////////////////////////
      const admin = await DRE.ethers.getSigner(
        await getEmergencyAdmin(poolConfig)
      );
      // Pause market during deployment
      await waitForTx(
        await lendPoolConfiguratorProxy.connect(admin).setPoolPause(true)
      );

      // Generic CToken & DebtToken Implementation in Pool
      await deployCTokenImplementations(
        pool,
        poolConfig.ReservesConfig,
        verify
      );

      // Generic CNFT Implementation in CNFT step, not here
      //await deployCNFTImplementations(pool, poolConfig.NftsConfig, verify);
    } catch (error) {
      throw error;
    }
  });
