const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  address: tradingAddress,
  abi: tradingABI,
} = require("../deployments/mumbai/POP_Trading.json");

const { ethers } = require("ethers");

// const productId = ethers.utils.formatBytes32String("PRODUCT_1");

const PROVIDER = process.env.MUMBAI_RPC;
const SEQUENCER = process.env.PK_SEQUENCER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(SEQUENCER, provider);

const trading = new ethers.Contract(tradingAddress, tradingABI, wallet);

async function getProductAndUserSpec(id) {
  const mintRequest = await trading.mintRequestIdToStructure(id);
  const strikeL = mintRequest["strikeLower"];
  const strikeU = mintRequest["strikeUpper"];

  const productId = mintRequest["productId"];
  const productInfo = await trading.getProduct(productId);
  const limit = productInfo.intervals;

  return [limit, strikeL, strikeU];
}

async function createPositionArray(limit, strikeL, strikeU) {
  /// The below lambda value is mock and should be calculated based on the formulas in the yellow paper in production env.
  const lambda = 43;
  const positionArray = new Array(Number(limit)).fill(0);

  // For strikeL:2 and strikeU:5 we will use include 1st-4th index.
  for (var i = strikeL; i <= strikeU; i++) {
    positionArray[i] = lambda;
  }

  return positionArray;
}

async function execute(id, positions) {
  const txn = await trading.mintPositionSequencer(id, positions, {
    gasLimit: 10000000,
  });
  const receipt = await txn.wait(1);

  console.log(receipt);
}

/// Should be a valid request id.
async function main() {
  try {
    const requestId = 1;

    const [limit, strikeL, strikeU] = await getProductAndUserSpec(requestId);

    const positionArray = await createPositionArray(limit, strikeL, strikeU);
    console.log(positionArray);

    // AFTER A POSITION IS MINTED, CHECK THE mintRequestStructure SCRIPT AND ENTER THE ID
    // AND SEE THE isFullFilled IS true AND WE HAVE AN ASSOCIATED positionId.
    await execute(requestId, positionArray);
  } catch (err) {
    console.error(err);
  }
}

main();
