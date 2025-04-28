import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ethers";
import "@typechain/hardhat";
import * as dotenv from "dotenv";
import { hardhat } from 'viem/chains';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY ? `0x${process.env.PRIVATE_KEY}` : "0x0000000000000000000000000000000000000000000000000000000000000000";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      viaIR: true
    }
  },
  etherscan: {
    apiKey: {
      pharosDevnet: process.env.PHAROS_ETHERSCAN_API_KEY || "",
    },
  },
  networks: {
    pharosDevnet: {
      url: process.env.PHAROS_RPC_URL || "https://polygon-mumbai.g.alchemy.com/v2/demo",
      accounts: [PRIVATE_KEY],
      gasPrice: 60000000000, // 60 gwei - increased for faster processing
      gas: 9000000, // Increased gas limit
      timeout: 1200000, // 20 minutes - increased for longer operations
      httpHeaders: {
        'Connection': 'keep-alive'
      },
      // Retry parameters for network requests
      networkCheckTimeout: 120000, // 2 minutes
      timeoutBlocks: 200, // Wait more blocks before timeout
      confirmations: 1, // Number of confirmations to wait between deployments
    },
    hardhat: {
      chainId: 1337,
      gas: 9000000, // Increased gas limit
      blockGasLimit: 9000000, // Increased block gas limit
      gasPrice: 60000000000, // 60 gwei
      mining: {
        auto: true, // Auto mine
        interval: 1000 // Mine every second
      }
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
      timeout: 1200000, // 20 minutes
      gas: 9000000, // Increased gas limit
      gasPrice: 60000000000, // 60 gwei
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v6",
  },
};

export default config;
