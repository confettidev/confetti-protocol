
# Confetti Protocol
This repository contains the smart contracts source code and markets configuration for Confetti Protocol. The repository uses Hardhat as development enviroment for compilation, testing and deployment tasks.

## What is Confetti?

Confetti is a decentralized non-custodial NFT lending protocol where users can participate as depositors or borrowers. Depositors provide liquidity to the market to earn a passive income, while borrowers are able to borrow in an overcollateralized fashion, using NFTs as collateral.

## Documentation

The documentation of Confetti Protocol is in the following [Confetti documentation](https://docs.confetti.finance/) link. At the documentation you can learn more about the protocol, see the contract interfaces, integration guides and audits.

## Audits

## Thanks
Confetti protocol refers to the architecture design and adopts some of the code of [AAVE](https://github.com/aave).
We are very grateful to AAVE for providing us with an excellent DeFi platform.

## Connect with the community

You can join at the [Discord](https://discord.com/invite/tV3t5hp5eh) channel

## Setup

The repository uses Docker Compose to manage sensitive keys and load the configuration. Prior any action like test or deploy, you must run `docker-compose up` to start the `contracts-env` container, and then connect to the container console via `docker-compose exec contracts-env bash`.

Follow the next steps to setup the repository:

- Install `docker` and `docker-compose`
- Create an enviroment file named `.env` and fill the next enviroment variables

```
# Mnemonic, only first address will be used
MNEMONIC=""

# Add Alchemy or Infura provider keys, alchemy takes preference at the config level
ALCHEMY_KEY=""
INFURA_KEY=""

# Optional Etherscan key, for automatize the verification of the contracts at Etherscan
ETHERSCAN_KEY=""

```

## Markets configuration

The configurations related with the Confetti Markets are located at `markets` directory. You can follow the `IConfettiConfiguration` interface to create new Markets configuration or extend the current Confetti configuration.

Each market should have his own Market configuration file, and their own set of deployment tasks, using the Confetti market config and tasks as a reference.

## Test

You can run the full test suite with the following commands:

```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# install dependencies
yarn install

# A new Bash terminal is prompted, connected to the container
npm run test
```

## Deployments

For deploying Confetti Protocol, you can use the available scripts located at `package.json`. For a complete list, run `npm run` to see all the tasks.

### Prepare
```
# In one terminal
docker-compose up

# Open another tab or terminal
docker-compose exec contracts-env bash

# install dependencies
yarn install

# Runing NPM task
# npm run xxx
```

### Localhost dev deployment
```
# In first terminal
npm run hardhat:node

# In second terminal
npm run confetti:localhost:dev:migration
```

### Localhost full deployment
```
# In first terminal
npm run hardhat:node

# In second terminal
npx hardhat --network localhost "dev:deploy-mock-reserves"
# then update pool config reserve address

npx hardhat --network localhost "dev:deploy-mock-nfts"
# then update pool config nft address

npx hardhat --network localhost "dev:deploy-mock-aggregators" --pool Confetti
# then update pool config reserve aggregators address

npx hardhat --network localhost "dev:deploy-mock-bnft-registry" --pool Confetti
# then update pool config bnft registry address

npx hardhat --network localhost "dev:deploy-mock-bnft-tokens" --pool Confetti
```

### Rinkeby full deployment
```
# In one terminal
npm run confetti:rinkeby:full:migration
```

## Tools

This project integrates other tools commonly used alongside Hardhat in the ecosystem.

It also comes with a variety of other tools, preconfigured to work with the project code.

Try running some of the following tasks:

```shell
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.js
node scripts/deploy.js
npx eslint '**/*.js'
npx eslint '**/*.js' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
```

## Etherscan verification

To try out Etherscan verification, you first need to deploy a contract to an Ethereum network that's supported by Etherscan, such as Ropsten.

In this project, copy the .env.template file to a file named .env, and then edit it to fill in the details. Enter your Etherscan API key, your Ropsten node URL (eg from Alchemy), and the private key of the account which will send the deployment transaction. With a valid .env file in place, first deploy your contract:

```shell
hardhat run --network ropsten scripts/deploy.js
```

Then, copy the deployment address and paste it in to replace `DEPLOYED_CONTRACT_ADDRESS` in this command:

```shell
npx hardhat verify --network ropsten DEPLOYED_CONTRACT_ADDRESS "Hello, Hardhat!"
```
