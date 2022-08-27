// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ICToken} from "../../interfaces/ICToken.sol";
import {IDebtToken} from "../../interfaces/IDebtToken.sol";
import {ILendPool} from "../../interfaces/ILendPool.sol";
import {ILendPoolAddressesProvider} from "../../interfaces/ILendPoolAddressesProvider.sol";

import {ICNFT} from "../../interfaces/ICNFT.sol";
import {ICNFTRegistry} from "../../interfaces/ICNFTRegistry.sol";

import {ConfettiUpgradeableProxy} from "../../libraries/proxy/ConfettiUpgradeableProxy.sol";
import {ReserveConfiguration} from "../../libraries/configuration/ReserveConfiguration.sol";
import {NftConfiguration} from "../../libraries/configuration/NftConfiguration.sol";
import {DataTypes} from "../../libraries/types/DataTypes.sol";
import {ConfigTypes} from "../../libraries/types/ConfigTypes.sol";
import {Errors} from "../../libraries/helpers/Errors.sol";

/**
 * @title ConfiguratorLogic library
 * @author Confetti
 * @notice Implements the logic to configuration feature
 */
library ConfiguratorLogic {
    using ReserveConfiguration for DataTypes.ReserveConfigurationMap;
    using NftConfiguration for DataTypes.NftConfigurationMap;

    /**
     * @dev Emitted when a reserve is initialized.
     * @param asset The address of the underlying asset of the reserve
     * @param cToken The address of the associated cToken contract
     * @param debtToken The address of the associated debtToken contract
     * @param interestRateAddress The address of the interest rate strategy for the reserve
     **/
    event ReserveInitialized(
        address indexed asset,
        address indexed cToken,
        address debtToken,
        address interestRateAddress
    );

    /**
     * @dev Emitted when a nft is initialized.
     * @param asset The address of the underlying asset of the nft
     * @param cNFT The address of the associated cNFT contract
     **/
    event NftInitialized(address indexed asset, address indexed cNFT);

    /**
     * @dev Emitted when an cToken implementation is upgraded
     * @param asset The address of the underlying asset of the reserve
     * @param proxy The cToken proxy address
     * @param implementation The new cToken implementation
     **/
    event CTokenUpgraded(
        address indexed asset,
        address indexed proxy,
        address indexed implementation
    );

    /**
     * @dev Emitted when the implementation of a debt token is upgraded
     * @param asset The address of the underlying asset of the reserve
     * @param proxy The debt token proxy address
     * @param implementation The new debtToken implementation
     **/
    event DebtTokenUpgraded(
        address indexed asset,
        address indexed proxy,
        address indexed implementation
    );

    function executeInitReserve(
        ILendPoolAddressesProvider addressProvider,
        ILendPool cachePool,
        ConfigTypes.InitReserveInput calldata input
    ) external {
        address cTokenProxyAddress = _initTokenWithProxy(
            input.cTokenImpl,
            abi.encodeWithSelector(
                ICToken.initialize.selector,
                addressProvider,
                input.treasury,
                input.underlyingAsset,
                input.underlyingAssetDecimals,
                input.cTokenName,
                input.cTokenSymbol
            )
        );

        address debtTokenProxyAddress = _initTokenWithProxy(
            input.debtTokenImpl,
            abi.encodeWithSelector(
                IDebtToken.initialize.selector,
                addressProvider,
                input.underlyingAsset,
                input.underlyingAssetDecimals,
                input.debtTokenName,
                input.debtTokenSymbol
            )
        );

        cachePool.initReserve(
            input.underlyingAsset,
            cTokenProxyAddress,
            debtTokenProxyAddress,
            input.interestRateAddress
        );

        DataTypes.ReserveConfigurationMap memory currentConfig = cachePool
            .getReserveConfiguration(input.underlyingAsset);

        currentConfig.setDecimals(input.underlyingAssetDecimals);

        currentConfig.setActive(true);
        currentConfig.setFrozen(false);

        cachePool.setReserveConfiguration(
            input.underlyingAsset,
            currentConfig.data
        );

        emit ReserveInitialized(
            input.underlyingAsset,
            cTokenProxyAddress,
            debtTokenProxyAddress,
            input.interestRateAddress
        );
    }

    function executeInitNft(
        ILendPool pool_,
        ICNFTRegistry registry_,
        ConfigTypes.InitNftInput calldata input
    ) external {
        // CNFT proxy and implementation are created in CNFTRegistry
        (address cNFTProxy, ) = registry_.getCNFTAddresses(
            input.underlyingAsset
        );
        require(cNFTProxy != address(0), Errors.LPC_INVALIED_CNFT_ADDRESS);

        pool_.initNft(input.underlyingAsset, cNFTProxy);

        DataTypes.NftConfigurationMap memory currentConfig = pool_
            .getNftConfiguration(input.underlyingAsset);

        currentConfig.setActive(true);
        currentConfig.setFrozen(false);

        pool_.setNftConfiguration(input.underlyingAsset, currentConfig.data);

        emit NftInitialized(input.underlyingAsset, cNFTProxy);
    }

    function executeUpdateCToken(
        ILendPool cachedPool,
        ConfigTypes.UpdateCTokenInput calldata input
    ) external {
        DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(
            input.asset
        );

        _upgradeTokenImplementation(
            reserveData.cTokenAddress,
            input.implementation,
            input.encodedCallData
        );

        emit CTokenUpgraded(
            input.asset,
            reserveData.cTokenAddress,
            input.implementation
        );
    }

    function executeUpdateDebtToken(
        ILendPool cachedPool,
        ConfigTypes.UpdateDebtTokenInput calldata input
    ) external {
        DataTypes.ReserveData memory reserveData = cachedPool.getReserveData(
            input.asset
        );

        _upgradeTokenImplementation(
            reserveData.debtTokenAddress,
            input.implementation,
            input.encodedCallData
        );

        emit DebtTokenUpgraded(
            input.asset,
            reserveData.debtTokenAddress,
            input.implementation
        );
    }

    function getTokenImplementation(address proxyAddress)
        external
        view
        returns (address)
    {
        ConfettiUpgradeableProxy proxy = ConfettiUpgradeableProxy(
            payable(proxyAddress)
        );
        return proxy.getImplementation();
    }

    function _initTokenWithProxy(
        address implementation,
        bytes memory initParams
    ) internal returns (address) {
        ConfettiUpgradeableProxy proxy = new ConfettiUpgradeableProxy(
            implementation,
            address(this),
            initParams
        );

        return address(proxy);
    }

    function _upgradeTokenImplementation(
        address proxyAddress,
        address implementation,
        bytes memory encodedCallData
    ) internal {
        ConfettiUpgradeableProxy proxy = ConfettiUpgradeableProxy(
            payable(proxyAddress)
        );

        if (encodedCallData.length > 0) {
            proxy.upgradeToAndCall(implementation, encodedCallData);
        } else {
            proxy.upgradeTo(implementation);
        }
    }
}
