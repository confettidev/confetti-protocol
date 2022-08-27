import { BigNumber } from "ethers";
import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { MAX_UINT_AMOUNT } from "../../helpers/constants";
import {
  deployConfettiCollector,
  deployConfettiProxyAdmin,
  deployConfettiUpgradeableProxy,
} from "../../helpers/contracts-deployments";
import {
  getConfettiCollectorProxy,
  getConfettiProxyAdminById,
  getConfettiUpgradeableProxy,
  getIErc20Detailed,
} from "../../helpers/contracts-getters";
import {
  convertToCurrencyDecimals,
  getEthersSignerByAddress,
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eNetwork, eContractid } from "../../helpers/types";
import { ConfettiCollector, ConfettiUpgradeableProxy } from "../../types";

task("full:deploy-confetti-collector", "Deploy Confetti collect contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ verify, pool }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const collectorProxyAdmin = await getConfettiProxyAdminById(
      eContractid.ConfettiProxyAdminFund
    );
    const proxyAdminOwner = await collectorProxyAdmin.owner();
    console.log(
      "Proxy Admin: address %s, owner %s",
      collectorProxyAdmin.address,
      proxyAdminOwner
    );

    const confettiCollectorImpl = await deployConfettiCollector(verify);
    const initEncodedData =
      confettiCollectorImpl.interface.encodeFunctionData("initialize");

    const confettiCollectorProxy = await deployConfettiUpgradeableProxy(
      eContractid.ConfettiCollector,
      collectorProxyAdmin.address,
      confettiCollectorImpl.address,
      initEncodedData,
      verify
    );
    console.log(
      "Confetti Collector: proxy %s, implementation %s",
      confettiCollectorProxy.address,
      confettiCollectorImpl.address
    );
  });

task("full:upgrade-confetti-collector", "Upgrade confetti collect contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("proxy", "Contract proxy address")
  .addOptionalParam("initFunc", "Name of initialize function")
  .setAction(async ({ verify, pool, proxy, initFunc }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const collectorProxyAdmin = await getConfettiProxyAdminById(
      eContractid.ConfettiProxyAdminFund
    );
    const proxyAdminOwnerAddress = await collectorProxyAdmin.owner();
    const proxyAdminOwnerSigner = await getEthersSignerByAddress(
      proxyAdminOwnerAddress
    );
    console.log(
      "Proxy Admin: address %s, owner %s",
      collectorProxyAdmin.address,
      proxyAdminOwnerAddress
    );

    const confettiCollectorProxy = await getConfettiUpgradeableProxy(proxy);
    console.log("Confetti Collector: proxy %s", confettiCollectorProxy.address);

    const confettiCollector = await getConfettiCollectorProxy(
      confettiCollectorProxy.address
    );

    const confettiCollectorImpl = await deployConfettiCollector(verify);
    console.log(
      "Confetti Collector: new implementation %s",
      confettiCollectorImpl.address
    );
    insertContractAddressInDb(
      eContractid.ConfettiCollector,
      confettiCollectorProxy.address
    );

    if (initFunc != undefined && initFunc != "") {
      const initEncodedData =
        confettiCollectorImpl.interface.encodeFunctionData(initFunc);

      await waitForTx(
        await collectorProxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgradeAndCall(
            confettiCollectorProxy.address,
            confettiCollectorImpl.address,
            initEncodedData
          )
      );
    } else {
      await waitForTx(
        await collectorProxyAdmin
          .connect(proxyAdminOwnerSigner)
          .upgrade(
            confettiCollectorProxy.address,
            confettiCollectorImpl.address
          )
      );
    }

    //await waitForTx(await confettiCollector.initialize_v2());

    console.log("Confetti Collector: upgrade ok");
  });

task("confetti-collector:approve-erc20", "Approve ERC20 token")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("proxy", "Contract proxy address")
  .addParam("token", "ERC20 token address")
  .addParam("to", "Target address, like 0.1")
  .addParam("amount", "Amount to approve")
  .setAction(async ({ verify, pool, proxy, token, to, amount }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    const confettiCollectorProxy = await getConfettiUpgradeableProxy(proxy);
    console.log("Confetti Collector: proxy %s", confettiCollectorProxy.address);

    const confettiCollector = await getConfettiCollectorProxy(
      confettiCollectorProxy.address
    );
    const ownerSigner = await getEthersSignerByAddress(
      await confettiCollector.owner()
    );

    let amountDecimals = MAX_UINT_AMOUNT;
    if (amount != "-1") {
      amountDecimals = (
        await convertToCurrencyDecimals(token, amount)
      ).toString();
    }

    await waitForTx(
      await confettiCollector
        .connect(ownerSigner)
        .approve(token, to, amountDecimals)
    );

    console.log("Confetti Collector: approve ok");
  });
