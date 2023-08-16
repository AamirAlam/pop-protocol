const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  address: tradingAddress,
  abi: tradingABI,
} = require("../deployments/mumbai/POP_Trading.json");

const {
  address: usdcAddress,
  abi: usdcABI,
} = require("../deployments/mumbai/MockUSDC.json");

const { ethers } = require("ethers");

const productId = ethers.utils.formatBytes32String("PRODUCT_1");

const PROVIDER = process.env.MUMBAI_RPC;
const DEPLOYER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(DEPLOYER, provider);

const trading = new ethers.Contract(tradingAddress, tradingABI, wallet);
const mock = new ethers.Contract(usdcAddress, usdcABI, wallet);

async function request(size, strikeU, strikeL) {
  try {
    const txn = await trading.requestPosition(
      productId,
      size,
      strikeL,
      strikeU
    );
    const receipt = await txn.wait(1);
    return receipt;
  } catch (err) {}
}

async function approveTokens(fee, sz) {
  try {
    const size = ethers.BigNumber.from(sz);
    const maxfee = ethers.BigNumber.from("1000000");

    const protocolCut = size * fee;
    const vaultCut = size * (maxfee - fee);
    const toApprove = (protocolCut + vaultCut).toString();

    const txn = await mock.approve(tradingAddress, toApprove);
    const receipt = await txn.wait(1);

    return receipt;
  } catch (err) {}
}

async function getProductFee() {
  const productDetails = await trading.getProduct(productId);
  return productDetails.fee;
}

async function main() {
  const fee = await getProductFee();
  const sz = "10";

  const approveSuccess = await approveTokens(fee, sz);
  console.log(approveSuccess);

  const strikeU = "5";
  const strikeL = "2";

  const requestSuccess = await request(sz, strikeU, strikeL);
  console.log(requestSuccess);
}

main();
