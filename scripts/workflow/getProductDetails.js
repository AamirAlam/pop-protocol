const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  address: tradingAddress,
  abi: tradingABI,
} = require("../deployments/mumbai/POP_Trading.json");

const { ethers } = require("ethers");

const PROVIDER = process.env.MUMBAI_RPC;
const DEPLOYER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(DEPLOYER, provider);

const trading = new ethers.Contract(tradingAddress, tradingABI, wallet);

async function getAll(productId) {
  const data = await trading.getProduct(productId);
  console.log(data);
}

async function main() {
  const productId =
    "0x50524f445543545f310000000000000000000000000000000000000000000000";

  getAll(productId);
}
main();
