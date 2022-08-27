import { task } from "hardhat/config";
import { formatEther } from "ethers/lib/utils";
import { deployLendPoolAddressesProvider } from "../../helpers/contracts-deployments";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import {
  ConfigNames,
  loadPoolConfig,
  getGenesisPoolAdmin,
  getEmergencyAdmin,
} from "../../helpers/configuration";
import { getDeploySigner } from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { eNetwork } from "../../helpers/types";

task(
  "full:deploy-address-provider",
  "Deploy address provider for full enviroment"
)
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("skipRegistry")
  .setAction(async ({ verify, pool, skipRegistry }, DRE) => {
    console.log("debug deploy provider");
    await DRE.run("set-DRE");
    const network = <eNetwork>DRE.network.name;
    const poolConfig = loadPoolConfig(pool);
    console.log("1");
    const signer = await getDeploySigner();
    console.log("2");

    // this contract is not support upgrade, just deploy new contract
    // Deploy address provider and set genesis manager
    const addressesProvider = await deployLendPoolAddressesProvider(
      poolConfig.MarketId,
      verify
    );
    console.log("3");

    // Add to registry or setup a new one
    if (!skipRegistry) {
      const providerRegistryAddress = getParamPerNetwork(
        poolConfig.ProviderRegistry,
        <eNetwork>DRE.network.name
      );
      console.log("4");
      await DRE.run("add-market-to-registry", {
        pool,
        addressesProvider: addressesProvider.address,
        deployRegistry: !notFalsyOrZeroAddress(providerRegistryAddress),
      });
    }
    console.log("5");
    // Set pool admins
    await waitForTx(
      await addressesProvider.setPoolAdmin(
        "0xCe7DA2634fF47036225456E507208Dbe8873F82F"
      )
    );
    console.log("6");
    await waitForTx(
      await addressesProvider.setEmergencyAdmin(
        "0xCe7DA2634fF47036225456E507208Dbe8873F82F"
      )
    );
    console.log("7");
    console.log("Pool Admin", await addressesProvider.getPoolAdmin());
    console.log("8");
    console.log("Emergency Admin", await addressesProvider.getEmergencyAdmin());
    console.log("9");
  });
