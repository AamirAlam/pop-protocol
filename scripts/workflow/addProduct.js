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

async function create(
  productIdInString,
  productNameInString,
  productSymbolInString,
  productParams
) {
  try {
    const productId = ethers.utils.formatBytes32String(productIdInString);
    const productName = ethers.utils.formatBytes32String(productNameInString);
    const productSymbol = ethers.utils.formatBytes32String(
      productSymbolInString
    );

    const txn = await trading.addProduct(
      productId,
      productName,
      productSymbol,
      productParams
    );
    const receipt = await txn.wait(1);
    console.log(receipt);
    return receipt;
  } catch (err) {
    console.error(err);
  }
}

async function main() {
  const productIdBase = "PRODUCT 3";
  const productName = "Chainlink";
  const productSymbol = "LINK";
  const productParams = {
    supplyBase: [],
    multiplicatorBase: [],
    limit: 500,
    supply: 1000000,
    margin: 1000,
    fee: 2000,
    positionContract: "0x0000000000000000000000000000000000000000",
  };

  await create(productIdBase, productName, productSymbol, productParams);
}

main();
