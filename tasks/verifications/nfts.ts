import { task } from "hardhat/config";
import { loadPoolConfig, ConfigNames } from "../../helpers/configuration";
import {
  getCNFT,
  getLendPoolAddressesProvider,
  getConfettiUpgradeableProxy,
  getCNFTRegistryProxy,
  getCNFTRegistryImpl,
  getLendPool,
} from "../../helpers/contracts-getters";
import {
  getParamPerNetwork,
  verifyContract,
} from "../../helpers/contracts-helpers";
import {
  eContractid,
  eNetwork,
  ICommonConfiguration,
  IReserveParams,
} from "../../helpers/types";

task("verify:nfts", "Verify nfts contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, all, pool }, localDRE) => {
    await localDRE.run("set-DRE");
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { NftsAssets, NftsConfig } = poolConfig as ICommonConfiguration;

    const addressesProvider = await getLendPoolAddressesProvider();

    const lendPoolProxy = await getLendPool(
      await addressesProvider.getLendPool()
    );

    const cnftRegistryAddress = await addressesProvider.getCNFTRegistry();
    const cnftRegistryProxy = await getConfettiUpgradeableProxy(
      cnftRegistryAddress
    );
    const cnftRegistryImpl = await getCNFTRegistryImpl();
    const cnftRegistry = await getCNFTRegistryProxy(cnftRegistryAddress);

    const cnftGenericImpl = await getCNFT(await cnftRegistry.cNFTGenericImpl());

    // CNFTRegistry proxy
    console.log("\n- Verifying CNFT Registry Proxy...\n");
    await verifyContract(
      eContractid.ConfettiUpgradeableProxy,
      cnftRegistryProxy,
      [
        cnftRegistryImpl.address,
        addressesProvider.address,
        cnftRegistryImpl.interface.encodeFunctionData("initialize", [
          cnftGenericImpl.address,
          poolConfig.Mocks.CNFTNamePrefix,
          poolConfig.Mocks.CNFTSymbolPrefix,
        ]),
      ]
    );

    // CNFT generic implementation
    console.log("\n- Verifying CNFT Generic Implementation...\n");
    await verifyContract(eContractid.CNFT, cnftGenericImpl, []);

    const configs = Object.entries(NftsConfig) as [string, IReserveParams][];
    for (const entry of Object.entries(
      getParamPerNetwork(NftsAssets, network)
    )) {
      const [token, tokenAddress] = entry;
      console.log(`- Verifying ${token} token related contracts`);

      const tokenConfig = configs.find(([symbol]) => symbol === token);
      if (!tokenConfig) {
        throw `NftsConfig not found for ${token} token`;
      }

      const { cNFTAddress } = await lendPoolProxy.getNftData(tokenAddress);
      //const { cNFTProxy, cNFTImpl } = await cnftRegistry.getCNFTAddresses(tokenAddress);

      // CNFT proxy for each nft asset
      console.log("\n- Verifying CNFT Proxy...\n");
      await verifyContract(
        eContractid.ConfettiUpgradeableProxy,
        await getConfettiUpgradeableProxy(cNFTAddress),
        [cnftRegistry.address]
      );
    }
  });
