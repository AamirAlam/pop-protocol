const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  address: tradingAddress,
  abi: tradingABI,
} = require("../deployments/mumbai/POP_Trading.json");

const {
  abi: positionABI,
} = require("../artifacts/contracts/Positions.sol/POP_Positions.json");

const { ethers } = require("ethers");

const PROVIDER = process.env.MUMBAI_RPC;
const DEPLOYER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(DEPLOYER, provider);

const trading = new ethers.Contract(tradingAddress, tradingABI, wallet);
// The position contract address is sent with the api call. We will use an exisiting address here for mock purpose.
const positionAddress = "0xF6F142Cd0AE69c42A4774C1a5bfc561d678A57e9";
const positions = new ethers.Contract(positionAddress, positionABI, wallet);

function getM(array, size) {
  if (size <= 0) {
    throw new Error("Size must be a positive integer.");
  }

  let sumOfSquares = 0;
  for (let i = 0; i < size; i++) {
    sumOfSquares += array[i] ** 2;
  }

  const sqrtResult = Math.sqrt(sumOfSquares);
  return sqrtResult;
}

async function sumArrays(array1, array2) {
  if (array1.length !== array2.length) {
    throw new Error("Arrays must have the same length.");
  }

  const sumArray = [];

  for (let i = 0; i < array1.length; i++) {
    sumArray.push(array1[i] + array2[i]);
  }

  return sumArray;
}

// Pay [M(q + q′) −M(q)] ∗(1 −fee) to user
async function getReturnFee(qi, qiDash, fee) {
  const sumArray = await sumArrays(qi, qiDash);

  const a = getM(sumArray, sumArray.length);
  const b = getM(qi, qi.length);

  const finalFee = fee / 1000000;
  const final = (a - b) * (1 - finalFee);

  return Math.floor(final * 1000000);
}

// Protocol collects [M(q + q′) −M(q)] ∗fee
async function getOwedFee(qi, qiDash, fee) {
  const sumArray = await sumArrays(qi, qiDash);

  const a = getM(sumArray, sumArray.length);
  const b = getM(qi, qi.length);

  const finalFee = fee / 1000000;
  const final = (a - b) * finalFee;

  return Math.floor(final * 1000000);
}

async function getQIDashArray(
  f,
  supply,
  nftPosition,
  multiplicator,
  nftMultiplicator,
  size
) {
  const finalArray = new Array(Number(size)).fill(0);

  for (var i = 0; i < size; i++) {
    const qiDash =
      (f * nftPosition[i] * multiplicator[i]) / nftMultiplicator[i];
    finalArray[i] = qiDash;
  }

  console.log("QI DASH : ", finalArray);
  return finalArray;
}

async function getQIArray(supply, qiDash, size) {
  const finalArray = new Array(Number(size)).fill(0);
  for (var i = 0; i < size; i++) {
    const qi = supply[i] - qiDash[i];
    finalArray[i] = qi;
  }
  console.log("QI ARRAY : ", finalArray);
  return finalArray;
}

async function makeCompatible(array, size) {
  const nodeCompatibleArray = [];
  for (let i = 0; i < size; i++) {
    const convertedValue = array[i].toString(); // or .toNumber()
    nodeCompatibleArray.push(Number(convertedValue));
  }

  return nodeCompatibleArray;
}

async function main() {
  const id = 1;
  const positionDetails = await positions.getPosition(id);

  var nftPosition = positionDetails.position;
  nftPosition = await makeCompatible(nftPosition, nftPosition.length);
  console.log("NFT POSITION :", nftPosition);

  var nftMultiplicator = positionDetails.multiplicator;
  nftMultiplicator = await makeCompatible(
    nftMultiplicator,
    nftMultiplicator.length
  );
  console.log("NFT MULTIPLICATOR :", nftMultiplicator);

  const productId =
    "0x50524f445543545f310000000000000000000000000000000000000000000000";
  const productDetails = await trading.getProduct(productId);

  const fee = productDetails.fee;
  console.log("Fee :", fee.toString);

  var supply = productDetails.supplyBase;
  supply = await makeCompatible(supply, supply.length);
  console.log("SUPPLY :", supply);

  var multiplicator = productDetails.multiplicatorBase;
  multiplicator = await makeCompatible(multiplicator, multiplicator.length);
  console.log("MULTIPLICATOR :", multiplicator);

  const fraction = 20;

  const qiDashArray = await getQIDashArray(
    fraction,
    supply,
    nftPosition,
    multiplicator,
    nftMultiplicator,
    nftMultiplicator.length
  );

  const qiArray = await getQIArray(supply, qiDashArray, supply.length);

  const toReturnFee = await getReturnFee(
    qiArray,
    qiDashArray,
    Number(fee.toString())
  );
  const owedFee = await getOwedFee(
    qiArray,
    qiDashArray,
    Number(fee.toString())
  );

  console.log("To Return :", toReturnFee);
  console.log("Owed :", owedFee);
}
main();
