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
      url: process.env.PHAROS_RPC_URL || "https://devnet.dplabs-internal.com/",
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      chainId: 1337
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
