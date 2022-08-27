// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.8.4;

import {ICNFTRegistry} from "../../interfaces/ICNFTRegistry.sol";
import {ICNFT} from "../../interfaces/ICNFT.sol";

import {AddressUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/AddressUpgradeable.sol";
import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {IERC721MetadataUpgradeable} from "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/IERC721MetadataUpgradeable.sol";
import {TransparentUpgradeableProxy} from "@openzeppelin/contracts/proxy/transparent/TransparentUpgradeableProxy.sol";

contract CNFTRegistry is ICNFTRegistry, Initializable, OwnableUpgradeable {
    mapping(address => address) public cNFTProxys;
    mapping(address => address) public cNFTImpls;
    address[] public cNFTAssetLists;
    string public namePrefix;
    string public symbolPrefix;
    address public cNFTGenericImpl;
    mapping(address => string) public customSymbols;

    function getCNFTAddresses(address nftAsset)
        external
        view
        override
        returns (address cNFTProxy, address cNFTImpl)
    {
        cNFTProxy = cNFTProxys[nftAsset];
        cNFTImpl = cNFTImpls[nftAsset];
    }

    function getCNFTAddressesByIndex(uint16 index)
        external
        view
        override
        returns (address cNFTProxy, address cNFTImpl)
    {
        require(index < cNFTAssetLists.length, "CNFTR: invalid index");
        cNFTProxy = cNFTProxys[cNFTAssetLists[index]];
        cNFTImpl = cNFTImpls[cNFTAssetLists[index]];
    }

    function getCNFTAssetList()
        external
        view
        override
        returns (address[] memory)
    {
        return cNFTAssetLists;
    }

    function allCNFTAssetLength() external view override returns (uint256) {
        return cNFTAssetLists.length;
    }

    function initialize(
        address genericImpl,
        string memory namePrefix_,
        string memory symbolPrefix_
    ) external override initializer {
        require(genericImpl != address(0), "CNFTR: impl is zero address");

        __Ownable_init();

        cNFTGenericImpl = genericImpl;

        namePrefix = namePrefix_;
        symbolPrefix = symbolPrefix_;

        emit Initialized(genericImpl, namePrefix, symbolPrefix);
    }

    /**
     * @dev See {ICNFTRegistry-createCNFT}.
     */
    function createCNFT(address nftAsset)
        external
        override
        returns (address cNFTProxy)
    {
        _requireAddressIsERC721(nftAsset);
        require(cNFTProxys[nftAsset] == address(0), "CNFTR: asset exist");
        require(cNFTGenericImpl != address(0), "CNFTR: impl is zero address");

        cNFTProxy = _createProxyAndInitWithImpl(nftAsset, cNFTGenericImpl);

        emit CNFTCreated(
            nftAsset,
            cNFTImpls[nftAsset],
            cNFTProxy,
            cNFTAssetLists.length
        );
    }

    /**
     * @dev See {ICNFTRegistry-setCNFTGenericImpl}.
     */
    function setCNFTGenericImpl(address genericImpl)
        external
        override
        onlyOwner
    {
        require(genericImpl != address(0), "CNFTR: impl is zero address");
        cNFTGenericImpl = genericImpl;

        emit GenericImplementationUpdated(genericImpl);
    }

    /**
     * @dev See {ICNFTRegistry-createCNFTWithImpl}.
     */
    function createCNFTWithImpl(address nftAsset, address cNFTImpl)
        external
        override
        onlyOwner
        returns (address cNFTProxy)
    {
        _requireAddressIsERC721(nftAsset);
        require(cNFTImpl != address(0), "CNFTR: implement is zero address");
        require(cNFTProxys[nftAsset] == address(0), "CNFTR: asset exist");

        cNFTProxy = _createProxyAndInitWithImpl(nftAsset, cNFTImpl);

        emit CNFTCreated(
            nftAsset,
            cNFTImpls[nftAsset],
            cNFTProxy,
            cNFTAssetLists.length
        );
    }

    /**
     * @dev See {ICNFTRegistry-upgradeCNFTWithImpl}.
     */
    function upgradeCNFTWithImpl(
        address nftAsset,
        address cNFTImpl,
        bytes memory encodedCallData
    ) external override onlyOwner {
        address cNFTProxy = cNFTProxys[nftAsset];
        require(cNFTProxy != address(0), "CNFTR: asset nonexist");

        TransparentUpgradeableProxy proxy = TransparentUpgradeableProxy(
            payable(cNFTProxy)
        );

        if (encodedCallData.length > 0) {
            proxy.upgradeToAndCall(cNFTImpl, encodedCallData);
        } else {
            proxy.upgradeTo(cNFTImpl);
        }

        cNFTImpls[nftAsset] = cNFTImpl;

        emit CNFTUpgraded(nftAsset, cNFTImpl, cNFTProxy, cNFTAssetLists.length);
    }

    /**
     * @dev See {ICNFTRegistry-addCustomeSymbols}.
     */
    function addCustomeSymbols(
        address[] memory nftAssets_,
        string[] memory symbols_
    ) external override onlyOwner {
        require(
            nftAssets_.length == symbols_.length,
            "CNFTR: inconsistent parameters"
        );

        for (uint256 i = 0; i < nftAssets_.length; i++) {
            customSymbols[nftAssets_[i]] = symbols_[i];
        }
    }

    function _createProxyAndInitWithImpl(address nftAsset, address cNFTImpl)
        internal
        returns (address cNFTProxy)
    {
        bytes memory initParams = _buildInitParams(nftAsset);

        TransparentUpgradeableProxy proxy = new TransparentUpgradeableProxy(
            cNFTImpl,
            address(this),
            initParams
        );

        cNFTProxy = address(proxy);

        cNFTImpls[nftAsset] = cNFTImpl;
        cNFTProxys[nftAsset] = cNFTProxy;
        cNFTAssetLists.push(nftAsset);
    }

    function _buildInitParams(address nftAsset)
        internal
        view
        returns (bytes memory initParams)
    {
        string memory nftSymbol = customSymbols[nftAsset];
        if (bytes(nftSymbol).length == 0) {
            nftSymbol = IERC721MetadataUpgradeable(nftAsset).symbol();
        }
        string memory cNFTName = string(
            abi.encodePacked(namePrefix, " ", nftSymbol)
        );
        string memory cNFTSymbol = string(
            abi.encodePacked(symbolPrefix, nftSymbol)
        );

        initParams = abi.encodeWithSelector(
            ICNFT.initialize.selector,
            nftAsset,
            cNFTName,
            cNFTSymbol
        );
    }

    function _requireAddressIsERC721(address nftAsset) internal view {
        require(nftAsset != address(0), "CNFTR: asset is zero address");
        require(
            AddressUpgradeable.isContract(nftAsset),
            "CNFTR: asset is not contract"
        );
    }
}
