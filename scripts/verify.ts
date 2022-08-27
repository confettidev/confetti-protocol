import { task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";

task("verify-weth", "Verifies WETH Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                // constructorArguments: tokenConf,
                contract: "contracts/mock/WETH9Mocked.sol:WETH9Mocked"
            });
        }
    );

task("verify-mintableerc721", "Verifies MintableERC721 Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                // constructorArguments: tokenConfConf,
                contract: "contracts/mock/MintableERC721.sol:MintableERC721"
            });
        }
    );

task("verify-bayc", "Verifies BAYC mock Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                constructorArguments: ["Confetti BAYC",
                         "BAYC"],
                contract: "contracts/mock/MintableERC721.sol:MintableERC721"
            });
        }
    );

task("verify-doodle", "Verifies doodle mock Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                constructorArguments: ["Confetti DOODLE",
                         "DOODLE"],
                contract: "contracts/mock/MintableERC721.sol:MintableERC721"
            });
        }
    );

task("verify-mocknftoracle", "Verifies MockNFTOracle Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/mock/MockNFTOracle.sol:MockNFTOracle"
            });
        }
    );

task("verify-mockreserveoracle", "Verifies MockReserveOracle Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/mock/MockReserveOracle.sol:MockReserveOracle"
            });
        }
    );

task("verify-mockchainlinkoracle", "Verifies MockChainlinkOracle Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                constructorArguments: [18],
                contract: "contracts/mock/MockChainlinkOracle.sol:MockChainlinkOracle"
            });
        }
    );

task("verify-configuratorlogic", "Verifies ConfiguratorLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/ConfiguratorLogic.sol:ConfiguratorLogic"
            });
        }
    );

task("verify-liquidatelogic", "Verifies LiquidateLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/LiquidateLogic.sol:LiquidateLogic"
            });
        }
    );

task("verify-borrowlogic", "Verifies BorrowLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/BorrowLogic.sol:BorrowLogic"
            });
        }
    );

task("verify-supplylogic", "Verifies SupplyLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/SupplyLogic.sol:SupplyLogic"
            });
        }
    );

task("verify-validationlogic", "Verifies ValidationLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/ValidationLogic.sol:ValidationLogic"
            });
        }
    );

task("verify-nftlogic", "Verifies NftLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/NftLogic.sol:NftLogic"
            });
        }
    );

task("verify-genericlogic", "Verifies GenericLogic Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/libraries/logic/GenericLogic.sol:GenericLogic"
            });
        }
    );

task("verify-cnft", "Verifies CNFT Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/mock/CNFT/CNFT.sol:CNFT"
            });
        }
    );

task("verify-mock-incentives", "Verifies MockIncentivesController Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/mock/MockIncentivesController.sol:MockIncentivesController"
            });
        }
    );

task("verify-ctoken", "Verifies cToken Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/protocol/CToken.sol:CToken"
            });
        }
    );

task("verify-debttoken", "Verifies debttoken Contract").addParam("address", "the token address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/protocol/DebtToken.sol:DebtToken"
            });
        }
    );

task("verify-lendpool", "Verifies LendPool Contract").addParam("address", "the lendPool address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                contract: "contracts/protocol/LendPool.sol:LendPool"
            });
        }
    );


task("verify-confettiprotocoldataprovider", "Verifies ConfettiProtocolDataProvider Contract").addParam("address", "the ConfettiProtocolDataProvider address")
    .setAction(
        async (args, hre) => {
            await hre.run("verify:verify", {
                address: args.address,
                constructorArguments: ["0x9d8EA35da08992F4aecb1C13fEf0B8781fc17bCb"],
                contract: "contracts/misc/ConfettiProtocolDataProvider.sol:ConfettiProtocolDataProvider"
            });
        }
    );
