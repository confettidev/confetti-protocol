import { task } from "hardhat/config";
import {
  loadPoolConfig,
  ConfigNames,
  getTreasuryAddress,
} from "../../helpers/configuration";
import {
  getCToken,
  getDebtToken,
  getInterestRate,
  getLendPoolAddressesProvider,
  getConfettiUpgradeableProxy,
  getLendPool,
  getLendPoolConfiguratorProxy,
  getUIPoolDataProvider,
  getWETHGateway,
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

task("verify:reserves", "Verify reserves contracts at Etherscan")
  .addParam(
    "pool",
    `Pool name to retrieve configuration, supported: ${Object.values(
      ConfigNames
    )}`
  )
  .setAction(async ({ pool }, localDRE) => {
    await localDRE.run("set-DRE");
    const network = localDRE.network.name as eNetwork;
    const poolConfig = loadPoolConfig(pool);
    const { ReserveAssets, ReservesConfig } =
      poolConfig as ICommonConfiguration;

    const addressesProvider = await getLendPoolAddressesProvider();
    const lendPoolProxy = await getLendPool(
      await addressesProvider.getLendPool()
    );

    const lendPoolConfigurator = await getLendPoolConfiguratorProxy(
      await addressesProvider.getLendPoolConfigurator()
    );

    // Generic cToken implementation
    const cTokenImpl = await getCToken();
    console.log("\n- Verifying CToken implementation...\n");
    // await verifyContract(eContractid.CToken, cTokenImpl, []);

    // Generic cToken implementation
    console.log("\n- Verifying DebtToken implementation...\n");
    const debtTokenImpl = await getDebtToken();
    // await verifyContract(eContractid.DebtToken, debtTokenImpl, []);

    const configs = Object.entries(ReservesConfig) as [
      string,
      IReserveParams
    ][];
    for (const entry of Object.entries(
      getParamPerNetwork(ReserveAssets, network)
    )) {
      const [token, tokenAddress] = entry;
      console.log(`- Verifying ${token} token related contracts`);
      const tokenConfig = configs.find(([symbol]) => symbol === token);
      if (!tokenConfig) {
        throw `ReservesConfig not found for ${token} token`;
      }

      const { cTokenAddress, debtTokenAddress, interestRateAddress } =
        await lendPoolProxy.getReserveData(tokenAddress);

      const {
        optimalUtilizationRate,
        baseVariableBorrowRate,
        variableRateSlope1,
        variableRateSlope2,
      } = tokenConfig[1].strategy;

      const cTokenContract = await getCToken(cTokenAddress);

      // Interes Rate
      // console.log(`\n- Verifying Interes rate...\n`);
      // console.log("addressesProvider.address," + addressesProvider.address);
      // console.log("optimalUtilizationRate = " + optimalUtilizationRate);
      // console.log("baseVariableBorrowRate = " + baseVariableBorrowRate );
      // console.log("variableRateSlope1 = " + variableRateSlope1);
      // console.log("variableRateSlope2 = " + variableRateSlope2);
      // await verifyContract(eContractid.InterestRate, await getInterestRate("0xA8c98f25C75f4F784Aed907910f983Aa12D89341"), [
      //   addressesProvider.address,
      //   optimalUtilizationRate,
      //   baseVariableBorrowRate,
      //   variableRateSlope1,
      //   variableRateSlope2,
      // ]);

      // Proxy cToken
      // console.log("\n- Verifying cToken proxy...\n");
      // const cTokenInitEncodeData = cTokenImpl.interface.encodeFunctionData("initialize", [
      //   addressesProvider.address,
      //   await cTokenContract.RESERVE_TREASURY_ADDRESS(),
      //   await cTokenContract.UNDERLYING_ASSET_ADDRESS(),
      //   await cTokenContract.decimals(),
      //   await cTokenContract.name(),
      //   await cTokenContract.symbol(),
      // ]);
      // await verifyContract(eContractid.ConfettiUpgradeableProxy, await getConfettiUpgradeableProxy(cTokenAddress), [
      //   cTokenImpl.address,
      //   lendPoolConfigurator.address,
      //   cTokenInitEncodeData,
      // ]);

      // Proxy debtToken
      // console.log("debtToken");
      // const debtTokenInitEncodeData = debtTokenImpl.interface.encodeFunctionData("initialize", [
      //   addressesProvider.address,
      //   await cTokenContract.UNDERLYING_ASSET_ADDRESS(),
      //   await cTokenContract.decimals(),
      //   await cTokenContract.name(),
      //   await cTokenContract.symbol(),
      // ]);
      // console.log("\n- Verifying debtToken proxy...\n");
      // await verifyContract(eContractid.ConfettiUpgradeableProxy, await getConfettiUpgradeableProxy(debtTokenAddress), [
      //   debtTokenImpl.address,
      //   lendPoolConfigurator.address,
      //   debtTokenInitEncodeData,
      // ]);

      // Interes Rate
      // console.log(`\n- Verifying Interes rate...\n`);
      // console.log("addressesProvider.address," + addressesProvider.address);
      // console.log("optimalUtilizationRate = " + optimalUtilizationRate);
      // console.log("baseVariableBorrowRate = " + baseVariableBorrowRate );
      // console.log("variableRateSlope1 = " + variableRateSlope1);
      // console.log("variableRateSlope2 = " + variableRateSlope2);
      // await verifyContract(eContractid.InterestRate, await getInterestRate(interestRateAddress), [
      //   addressesProvider.address,
      //   optimalUtilizationRate,
      //   baseVariableBorrowRate,
      //   variableRateSlope1,
      //   variableRateSlope2,
      // ]);
    }
  });
