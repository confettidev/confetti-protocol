import { task } from "hardhat/config";
import { ConfigNames, loadPoolConfig } from "../../helpers/configuration";
import {
  getConfettiProtocolDataProvider,
  getCToken,
  getDebtToken,
  getIErc20Detailed,
  getLendPoolAddressesProvider,
  getUIPoolDataProvider,
} from "../../helpers/contracts-getters";
import { getParamPerNetwork } from "../../helpers/contracts-helpers";
import { DRE } from "../../helpers/misc-utils";
import { eEthereumNetwork, eNetwork } from "../../helpers/types";

task("print-reserve", "Print data of specified reserve and user")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .addParam("asset", `Reserve address`)
  .addOptionalParam("user", `User address`)
  .setAction(async ({ pool, asset, user }, localBRE) => {
    await localBRE.run("set-DRE");
    const network = process.env.FORK
      ? (process.env.FORK as eNetwork)
      : (localBRE.network.name as eNetwork);
    const poolConfig = loadPoolConfig(pool);

    const addressProvider = await getLendPoolAddressesProvider();
    const protocolDataProvider = await getConfettiProtocolDataProvider(
      await addressProvider.getConfettiDataProvider()
    );
    const uiDataProvider = await getUIPoolDataProvider(
      await addressProvider.getUIDataProvider()
    );

    const reserveToken = await protocolDataProvider.getReserveTokenData(asset);
    const cTokenContract = await getCToken(reserveToken.cTokenAddress);
    const cTokenTotalSupply = await cTokenContract.totalSupply();
    const debtTokenContract = await getDebtToken(reserveToken.debtTokenAddress);
    const debtTokenTotalSupply = await debtTokenContract.totalSupply();
    const underlyingContract = await getIErc20Detailed(asset);
    const underlyingBalance = await underlyingContract.balanceOf(
      reserveToken.cTokenAddress
    );

    console.log(`- reserve token`);
    console.log(`  - underlyingSymbol:`, await underlyingContract.symbol());
    console.log(`  - underlyingDecimals:`, await underlyingContract.decimals());
    console.log(`  - underlyingBalance:`, underlyingBalance.toString());
    console.log(`  - cTokenTotalSupply:`, cTokenTotalSupply.toString());
    console.log(`  - debtTokenTotalSupply:`, debtTokenTotalSupply.toString());

    const reserveData = await protocolDataProvider.getReserveData(asset);

    console.log(`- reserve data`);
    const reserveFields = [
      "availableLiquidity",
      "totalVariableDebt",
      "liquidityRate",
      "variableBorrowRate",
      "liquidityIndex",
      "variableBorrowIndex",
      "lastUpdateTimestamp",
    ];
    reserveFields.forEach((field, index) => {
      console.log(`  - ${field}:`, reserveData[field].toString());
    });

    if (user != undefined) {
      const userReserveData = await protocolDataProvider.getUserReserveData(
        asset,
        user
      );

      console.log(`- user reserve data`);
      const userReserveFields = [
        "currentCTokenBalance",
        "currentVariableDebt",
        "scaledVariableDebt",
      ];
      userReserveFields.forEach((field, index) => {
        console.log(`  - ${field}:`, userReserveData[field].toString());
      });
    }
  });
