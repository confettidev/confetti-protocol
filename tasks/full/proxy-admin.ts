import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import { deployConfettiProxyAdmin } from "../../helpers/contracts-deployments";
import { getConfettiProxyAdminByAddress } from "../../helpers/contracts-getters";
import {
  getParamPerNetwork,
  insertContractAddressInDb,
} from "../../helpers/contracts-helpers";
import { notFalsyOrZeroAddress, waitForTx } from "../../helpers/misc-utils";
import { eNetwork, eContractid } from "../../helpers/types";
import { ConfettiProxyAdmin } from "../../types";

task("full:deploy-proxy-admin", "Deploy proxy admin contract")
  .addFlag("verify", "Verify contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addFlag("skipPool", "Skip proxy admin for POOL")
  .addFlag("skipFund", "Skip proxy admin for FUND")
  .setAction(async ({ verify, pool, skipPool, skipFund }, DRE) => {
    await DRE.run("set-DRE");
    const poolConfig = loadPoolConfig(pool);
    const network = <eNetwork>DRE.network.name;

    if (!skipPool) {
      let proxyAdmin: ConfettiProxyAdmin;
      const proxyAdminAddress = getParamPerNetwork(
        poolConfig.ProxyAdminPool,
        network
      );
      if (
        proxyAdminAddress == undefined ||
        !notFalsyOrZeroAddress(proxyAdminAddress)
      ) {
        proxyAdmin = await deployConfettiProxyAdmin(
          eContractid.ConfettiProxyAdminPool,
          verify
        );
      } else {
        await insertContractAddressInDb(
          eContractid.ConfettiProxyAdminPool,
          proxyAdminAddress
        );
        proxyAdmin = await getConfettiProxyAdminByAddress(proxyAdminAddress);
      }
      console.log(
        "ProxyAdminPool Address:",
        proxyAdmin.address,
        "Owner Address:",
        await proxyAdmin.owner()
      );
    }

    if (!skipFund) {
      let proxyAdmin: ConfettiProxyAdmin;
      const proxyAdminAddress = getParamPerNetwork(
        poolConfig.ProxyAdminFund,
        network
      );
      if (
        proxyAdminAddress == undefined ||
        !notFalsyOrZeroAddress(proxyAdminAddress)
      ) {
        proxyAdmin = await deployConfettiProxyAdmin(
          eContractid.ConfettiProxyAdminFund,
          verify
        );
      } else {
        await insertContractAddressInDb(
          eContractid.ConfettiProxyAdminFund,
          proxyAdminAddress
        );
        proxyAdmin = await getConfettiProxyAdminByAddress(proxyAdminAddress);
      }
      console.log(
        "ConfettiProxyAdminFund Address:",
        proxyAdmin.address,
        "Owner Address:",
        await proxyAdmin.owner()
      );
    }
  });
