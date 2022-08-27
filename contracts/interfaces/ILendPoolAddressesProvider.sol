// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

/**
 * @title LendPoolAddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol, including permissioned roles
 * - Acting also as factory of proxies and admin of those, so with right to change its implementations
 * - Owned by the Confetti Governance
 * @author Confetti
 **/
interface ILendPoolAddressesProvider {
    event MarketIdSet(string newMarketId);
    event LendPoolUpdated(address indexed newAddress, bytes encodedCallData);
    event ConfigurationAdminUpdated(address indexed newAddress);
    event EmergencyAdminUpdated(address indexed newAddress);
    event LendPoolConfiguratorUpdated(
        address indexed newAddress,
        bytes encodedCallData
    );
    event ReserveOracleUpdated(address indexed newAddress);
    event NftOracleUpdated(address indexed newAddress);
    event LendPoolLoanUpdated(
        address indexed newAddress,
        bytes encodedCallData
    );
    event ProxyCreated(bytes32 id, address indexed newAddress);
    event AddressSet(
        bytes32 id,
        address indexed newAddress,
        bool hasProxy,
        bytes encodedCallData
    );
    event CNFTRegistryUpdated(address indexed newAddress);
    event IncentivesControllerUpdated(address indexed newAddress);
    event UIDataProviderUpdated(address indexed newAddress);
    event ConfettiDataProviderUpdated(address indexed newAddress);
    event WalletBalanceProviderUpdated(address indexed newAddress);

    function getMarketId() external view returns (string memory);

    function setMarketId(string calldata marketId) external;

    function setAddress(bytes32 id, address newAddress) external;

    function setAddressAsProxy(
        bytes32 id,
        address impl,
        bytes memory encodedCallData
    ) external;

    function getAddress(bytes32 id) external view returns (address);

    function getLendPool() external view returns (address);

    function setLendPoolImpl(address pool, bytes memory encodedCallData)
        external;

    function getLendPoolConfigurator() external view returns (address);

    function setLendPoolConfiguratorImpl(
        address configurator,
        bytes memory encodedCallData
    ) external;

    function getPoolAdmin() external view returns (address);

    function setPoolAdmin(address admin) external;

    function getEmergencyAdmin() external view returns (address);

    function setEmergencyAdmin(address admin) external;

    function getReserveOracle() external view returns (address);

    function setReserveOracle(address reserveOracle) external;

    function getNFTOracle() external view returns (address);

    function setNFTOracle(address nftOracle) external;

    function getLendPoolLoan() external view returns (address);

    function setLendPoolLoanImpl(address loan, bytes memory encodedCallData)
        external;

    function getCNFTRegistry() external view returns (address);

    function setCNFTRegistry(address factory) external;

    function getIncentivesController() external view returns (address);

    function setIncentivesController(address controller) external;

    function getUIDataProvider() external view returns (address);

    function setUIDataProvider(address provider) external;

    function getConfettiDataProvider() external view returns (address);

    function setConfettiDataProvider(address provider) external;

    function getWalletBalanceProvider() external view returns (address);

    function setWalletBalanceProvider(address provider) external;
}
