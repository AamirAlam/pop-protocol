/**
 * @type import('hardhat/config').HardhatUserConfig
 */
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-solhint");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

// polygon etherscan: 3D8B45QBXTFRGM1FV7D5GCXQRZHEIA59IZ
module.exports = {
  etherscan: {
    apiKey: {
      scrollSepolia: "WPDBQAUENJ3I3JTDIJNV8AMF5F7G6F926N",
      arbitrumGoerli: "CC5V3EGGSA1WYTM152F75BIVB33WN7FT3V",
      sepolia: "36QV5RR1WHHYWBH81P4V3KY2DKCZ7RR4ZH",
      polygon: "3D8B45QBXTFRGM1FV7D5GCXQRZHEIA59IZ",
    },
    //  "36QV5RR1WHHYWBH81P4V3KY2DKCZ7RR4ZH", // "2X7YUM8RI1H8JM3BCSAEFQ2SH5V34QVRDA",
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
