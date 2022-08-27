import { task } from "hardhat/config";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import {
  eContractid,
  tEthereumAddress,
  ConfettiPools,
} from "../../helpers/types";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  deployCNFTRegistry,
  deployGenericCNFTImpl,
  deployConfettiUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getLendPoolAddressesProvider,
  getCNFTRegistryProxy,
  getConfettiProxyAdminById,
  getConfigMockedNfts,
  getProxyAdminSigner,
} from "../../helpers/contracts-getters";
import { MintableERC721 } from "../../types";

task("dev:deploy-mock-cnft-registry", "Deploy cnft registry for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const proxyAdminAddress = await (await getProxyAdminSigner()).getAddress();

    const poolConfig = loadPoolConfig(pool);

    const cnftGenericImpl = await deployGenericCNFTImpl(verify);

    const cnftRegistryImpl = await deployCNFTRegistry(verify);

    const initEncodedData = cnftRegistryImpl.interface.encodeFunctionData(
      "initialize",
      [
        cnftGenericImpl.address,
        poolConfig.Mocks.CNFTNamePrefix,
        poolConfig.Mocks.CNFTSymbolPrefix,
      ]
    );

    const cnftRegistryProxy = await deployConfettiUpgradeableProxy(
      eContractid.CNFTRegistry,
      proxyAdminAddress,
      cnftRegistryImpl.address,
      initEncodedData,
      verify
    );
  });

task("dev:deploy-mock-cnft-tokens", "Deploy cnft tokens for dev enviroment")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, localBRE) => {
    await localBRE.run("set-DRE");

    const poolConfig = loadPoolConfig(pool);

    const cnftRegistryProxy = await getCNFTRegistryProxy();

    const mockedNfts = await getConfigMockedNfts(poolConfig);

    for (const [nftSymbol, mockedNft] of Object.entries(mockedNfts) as [
      string,
      MintableERC721
    ][]) {
      await waitForTx(await cnftRegistryProxy.createCNFT(mockedNft.address));
      const { cNFTProxy } = await cnftRegistryProxy.getCNFTAddresses(
        mockedNft.address
      );
      console.log("CNFT Token:", nftSymbol, cNFTProxy);
    }
  });
