import { Signer } from "@ethersproject/abstract-signer";
import { ContractTransaction, ContractFactory, Overrides } from "@ethersproject/contracts";
import { Wallet } from "@ethersproject/wallet";

import { Decimal } from "givety-lib-base";

import {
  _GivetyContractAddresses,
  _GivetyContracts,
  _GivetyDeploymentJSON,
  _connectToContracts
} from "../src/contracts";

import { createGiveSwapPair } from "./GiveSwapFactory";

let silent = true;

export const log = (...args: unknown[]): void => {
  if (!silent) {
    console.log(...args);
  }
};

export const setSilent = (s: boolean): void => {
  silent = s;
};

const deployContractAndGetBlockNumber = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  contractName: string,
  ...args: unknown[]
): Promise<[address: string, blockNumber: number]> => {
  log(`Deploying ${contractName} ...`);
  const contract = await (await getContractFactory(contractName, deployer)).deploy(...args);

  log(`Waiting for transaction ${contract.deployTransaction.hash} ...`);
  const receipt = await contract.deployTransaction.wait();

  log({
    contractAddress: contract.address,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toNumber()
  });

  log();

  return [contract.address, receipt.blockNumber];
};

const deployContract: (
  ...p: Parameters<typeof deployContractAndGetBlockNumber>
) => Promise<string> = (...p) => deployContractAndGetBlockNumber(...p).then(([a]) => a);

const deployContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  priceFeedIsTestnet = true,
  overrides?: Overrides
): Promise<[addresses: Omit<_GivetyContractAddresses, "givToken">, startBlock: number]> => {
  const [activePoolAddress, startBlock] = await deployContractAndGetBlockNumber(
    deployer,
    getContractFactory,
    "ActivePool",
    { ...overrides }
  );

  const addresses = {
    activePool: activePoolAddress,
    borrowerOperations: await deployContract(deployer, getContractFactory, "BorrowerOperations", {
      ...overrides
    }),
    troveManager: await deployContract(deployer, getContractFactory, "TroveManager", {
      ...overrides
    }),
    collSurplusPool: await deployContract(deployer, getContractFactory, "CollSurplusPool", {
      ...overrides
    }),
    communityIssuance: await deployContract(deployer, getContractFactory, "CommunityIssuance", {
      ...overrides
    }),
    defaultPool: await deployContract(deployer, getContractFactory, "DefaultPool", { ...overrides }),
    hintHelpers: await deployContract(deployer, getContractFactory, "HintHelpers", { ...overrides }),
    lockupContractFactory: await deployContract(
      deployer,
      getContractFactory,
      "LockupContractFactory",
      { ...overrides }
    ),
    gvtyStaking: await deployContract(deployer, getContractFactory, "GVTYStaking", { ...overrides }),
    priceFeed: await deployContract(
      deployer,
      getContractFactory,
      priceFeedIsTestnet ? "PriceFeedTestnet" : "PriceFeed",
      { ...overrides }
    ),
    sortedTroves: await deployContract(deployer, getContractFactory, "SortedTroves", {
      ...overrides
    }),
    stabilityPool: await deployContract(deployer, getContractFactory, "StabilityPool", {
      ...overrides
    }),
    gasPool: await deployContract(deployer, getContractFactory, "GasPool", {
      ...overrides
    }),
    givpool: await deployContract(deployer, getContractFactory, "Givpool", { ...overrides })
  };

  return [
    {
      ...addresses,
      gusdToken: await deployContract(
        deployer,
        getContractFactory,
        "GUSDToken",
        addresses.troveManager,
        addresses.stabilityPool,
        addresses.borrowerOperations,
        { ...overrides }
      ),

      gvtyToken: await deployContract(
        deployer,
        getContractFactory,
        "GVTYToken",
        addresses.communityIssuance,
        addresses.gvtyStaking,
        addresses.lockupContractFactory,
        Wallet.createRandom().address, // _bountyAddress (TODO: parameterize this)
        addresses.givpool, // _lpRewardsAddress
        Wallet.createRandom().address, // _multisigAddress (TODO: parameterize this)
        { ...overrides }
      ),

      multiTroveGetter: await deployContract(
        deployer,
        getContractFactory,
        "MultiTroveGetter",
        addresses.troveManager,
        addresses.sortedTroves,
        { ...overrides }
      )
    },

    startBlock
  ];
};

export const deployTellorCaller = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  tellorAddress: string,
  overrides?: Overrides
): Promise<string> =>
  deployContract(deployer, getContractFactory, "TellorCaller", tellorAddress, { ...overrides });

const connectContracts = async (
  {
    activePool,
    borrowerOperations,
    troveManager,
    gusdToken,
    collSurplusPool,
    communityIssuance,
    defaultPool,
    gvtyToken,
    hintHelpers,
    lockupContractFactory,
    gvtyStaking,
    priceFeed,
    sortedTroves,
    stabilityPool,
    gasPool,
    givpool,
    givToken
  }: _GivetyContracts,
  deployer: Signer,
  overrides?: Overrides
) => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  const txCount = await deployer.provider.getTransactionCount(deployer.getAddress());

  const connections: ((nonce: number) => Promise<ContractTransaction>)[] = [
    nonce =>
      sortedTroves.setParams(1e6, troveManager.address, borrowerOperations.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      troveManager.setAddresses(
        borrowerOperations.address,
        activePool.address,
        defaultPool.address,
        stabilityPool.address,
        gasPool.address,
        collSurplusPool.address,
        priceFeed.address,
        gusdToken.address,
        sortedTroves.address,
        gvtyToken.address,
        gvtyStaking.address,
        { ...overrides, nonce }
      ),

    nonce =>
      borrowerOperations.setAddresses(
        troveManager.address,
        activePool.address,
        defaultPool.address,
        stabilityPool.address,
        gasPool.address,
        collSurplusPool.address,
        priceFeed.address,
        sortedTroves.address,
        gusdToken.address,
        gvtyStaking.address,
        { ...overrides, nonce }
      ),

    nonce =>
      stabilityPool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        activePool.address,
        gusdToken.address,
        sortedTroves.address,
        priceFeed.address,
        communityIssuance.address,
        { ...overrides, nonce }
      ),

    nonce =>
      activePool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        stabilityPool.address,
        defaultPool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      defaultPool.setAddresses(troveManager.address, activePool.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      collSurplusPool.setAddresses(
        borrowerOperations.address,
        troveManager.address,
        activePool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      hintHelpers.setAddresses(sortedTroves.address, troveManager.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      gvtyStaking.setAddresses(
        gvtyToken.address,
        gusdToken.address,
        troveManager.address,
        borrowerOperations.address,
        activePool.address,
        { ...overrides, nonce }
      ),

    nonce =>
      lockupContractFactory.setGVTYTokenAddress(gvtyToken.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      communityIssuance.setAddresses(gvtyToken.address, stabilityPool.address, {
        ...overrides,
        nonce
      }),

    nonce =>
      givpool.setParams(gvtyToken.address, givToken.address, 2 * 30 * 24 * 60 * 60, {
        ...overrides,
        nonce
      })
  ];

  const txs = await Promise.all(connections.map((connect, i) => connect(txCount + i)));

  let i = 0;
  await Promise.all(txs.map(tx => tx.wait().then(() => log(`Connected ${++i}`))));
};

const deployMockGivToken = (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  overrides?: Overrides
) =>
  deployContract(
    deployer,
    getContractFactory,
    "ERC20Mock",
    "Mock GiveSwap",
    "GiveSwap",
    Wallet.createRandom().address, // initialAccount
    0, // initialBalance
    { ...overrides }
  );

export const deployAndSetupContracts = async (
  deployer: Signer,
  getContractFactory: (name: string, signer: Signer) => Promise<ContractFactory>,
  _priceFeedIsTestnet = true,
  _isDev = true,
  giveAddress?: string,
  overrides?: Overrides
): Promise<_GivetyDeploymentJSON> => {
  if (!deployer.provider) {
    throw new Error("Signer must have a provider.");
  }

  log("Deploying contracts...");
  log();

  const deployment: _GivetyDeploymentJSON = {
    chainId: await deployer.getChainId(),
    version: "unknown",
    deploymentDate: new Date().getTime(),
    bootstrapPeriod: 0,
    totalStabilityPoolGVTYReward: "0",
    liquidityMiningGVTYRewardRate: "0",
    _priceFeedIsTestnet,
    _givTokenIsMock: !giveAddress,
    _isDev,

    ...(await deployContracts(deployer, getContractFactory, _priceFeedIsTestnet, overrides).then(
      async ([addresses, startBlock]) => ({
        startBlock,

        addresses: {
          ...addresses,

          givToken: await (giveAddress
            ? createGiveSwapPair(deployer, giveAddress, addresses.gusdToken, overrides)
            : deployMockGivToken(deployer, getContractFactory, overrides))
        }
      })
    ))
  };

  const contracts = _connectToContracts(deployer, deployment);

  log("Connecting contracts...");
  await connectContracts(contracts, deployer, overrides);

  const gvtyTokenDeploymentTime = await contracts.gvtyToken.getDeploymentStartTime();
  const bootstrapPeriod = await contracts.troveManager.BOOTSTRAP_PERIOD();
  const totalStabilityPoolGVTYReward = await contracts.communityIssuance.GVTYSupplyCap();
  const liquidityMiningGVTYRewardRate = await contracts.givpool.rewardRate();

  return {
    ...deployment,
    deploymentDate: gvtyTokenDeploymentTime.toNumber() * 1000,
    bootstrapPeriod: bootstrapPeriod.toNumber(),
    totalStabilityPoolGVTYReward: `${Decimal.fromBigNumberString(
      totalStabilityPoolGVTYReward.toHexString()
    )}`,
    liquidityMiningGVTYRewardRate: `${Decimal.fromBigNumberString(
      liquidityMiningGVTYRewardRate.toHexString()
    )}`
  };
};
