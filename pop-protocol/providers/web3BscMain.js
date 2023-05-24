const Web3 = require("web3");
const { NETWORK_RPC } = require("../constants");

const rpc = NETWORK_RPC?.[56];
const provider = new Web3.providers.HttpProvider(rpc);
const web3BscMain = new Web3(provider);

module.exports = { web3BscMain };
