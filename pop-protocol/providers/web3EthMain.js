const Web3 = require("web3");
const { NETWORK_RPC } = require("../../constants");

const rpc = NETWORK_RPC?.[1];
const provider = new Web3.providers.HttpProvider(rpc);
const web3EthMain = new Web3(provider);

module.exports = { web3EthMain };
