const { web3BscTest } = require("./web3BscTest");
const { web3BscMain } = require("./web3BscMain");
const { web3EthTest } = require("./web3EthTest");
const { web3EthMain } = require("./web3EthMain");

const web3Provider = (chainId) => {
  const key = parseInt(chainId);
  switch (key) {
    case 1:
      return web3EthMain;

    case 4:
      return web3EthTest;

    case 56:
      return web3BscMain;

    case 97:
      return web3BscTest;

    default:
      return web3EthTest;
  }
};

module.exports = { web3Provider };
