/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-solhint");
require("dotenv").config();

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

// polygon etherscan: 3D8B45QBXTFRGM1FV7D5GCXQRZHEIA59IZ
module.exports = {
  etherscan: {
    apiKey: {
      scrollSepolia: process.env.ETHERSCAN_SCROLL,
      arbitrumGoerli: process.env.ETHERSCAN_ARB,
      sepolia: process.env.ETHERSCAN_SEPOLIA,
      polygon: process.env.ETHERSCAN_POLYGON,
    },
    customChains: [
      {
        network: "scrollSepolia",
        chainId: 534351,
        urls: {
          apiURL: "https://api-sepolia.scrollscan.com/api",
          browserURL: "https://sepolia.scrollscan.com/",
        },
      },
    ],
  },
  solidity: {
    compilers: [
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.6",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.7.0",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.7",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.4.24",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.9",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.10",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
    gas: 700000000,
    //  gasMultiplier:5,
    gasPrice: 5,
  },

  defaultNetwork: "hardhat",

  networks: {
    polygon: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.private_key],
      // gas: 3000000, // <--- Twice as much
      // gasPrice: 800000000000,
      timeout: 999999,
    },
    matictest: {
      url: "https://matic-mumbai.chainstacklabs.com/",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
    goerli: {
      url: "https://goerli.blockpi.network/v1/rpc/public",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
    scrollSepolia: {
      // chainId: 534351,
      url: "https://sepolia-rpc.scroll.io/" || "",
      accounts:
        process.env.private_key !== undefined ? [process.env.private_key] : [],
    },
    arbitrum_goerli: {
      url: "https://endpoints.omniatech.io/v1/arbitrum/goerli/public",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
    mentle: {
      url: "https://rpc.testnet.mantle.xyz",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
    sepolia: {
      url: "https://eth-sepolia.api.onfinality.io/public",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
  },
};
