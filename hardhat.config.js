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

module.exports = {
  etherscan: {
    apiKey: "2X7YUM8RI1H8JM3BCSAEFQ2SH5V34QVRDA",
  },
  solidity: {
    compilers: [
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
    ],
    gas: 700000000,
    //  gasMultiplier:5,
    gasPrice: 5,
  },

  defaultNetwork: "hardhat",

  networks: {
    maticmain: {
      url: "https://polygon-rpc.com/",
      accounts: [process.env.private_key],
      gas: 3000000, // <--- Twice as much
      gasPrice: 800000000000,
      timeout: 999999,
    },
    matictest: {
      url: "https://matic-mumbai.chainstacklabs.com/",
      accounts: [process.env.private_key],
      timeout: 999999,
    },
  },
};
