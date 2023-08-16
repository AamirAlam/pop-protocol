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

const PROVIDER = process.env.MUMBAI_RPC;
const SEQUENCER = process.env.PK_SEQUENCER;
const DEPLOYER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);

const walletSequencer = new ethers.Wallet(SEQUENCER, provider);
const wallet = new ethers.Wallet(DEPLOYER, provider);

const mock = new ethers.Contract(usdcAddress, usdcABI, wallet);
const trading = new ethers.Contract(tradingAddress, tradingABI, wallet);

async function getSequencerRSV(positionId, productId) {
  try {
    // const message = `Position ${positionId} Product ${productId}`;

    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "bytes32", "string", "uint256"],
      ["Product:", productId, "Position:", positionId]
    );
    const payloadHash = ethers.utils.keccak256(payload);

    const toCheck = ethers.utils.solidityKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", payloadHash]
    );
    console.log(toCheck);

    // Sign the message using the wallet
    const signature = await walletSequencer.signMessage(
      ethers.utils.arrayify(payloadHash)
    );

    const sig = ethers.utils.splitSignature(signature);
    const r = sig.r;
    const s = sig.s;
    const v = sig.v;

    return [toCheck, r, s, v];
  } catch (err) {
    console.error(err);
  }
}

async function approveTokens(amount) {
  try {
    const txn = await mock.approve(tradingAddress, amount);
    const receipt = await txn.wait(1);

    return receipt;
  } catch (err) {}
}

async function main() {
  // ASSUMING THE FEE FOR NOW. WILL BE CALCULATED ON THE FRONTEND.
  const owed = "1000000";
  const toReturn = "200000";
  const approveSuccess = await approveTokens(owed);

  const productId =
    "0x50524f445543545f310000000000000000000000000000000000000000000000";
  const positionId = "1";

  const [toCheck, r, s, v] = await getSequencerRSV(positionId, productId);

  const txn = await trading.requestBurn(
    productId,
    positionId,
    toCheck,
    v,
    r,
    s,
    owed,
    toReturn,
    {
      gasLimit: 10000000,
    }
  );
  const receipt = await txn.wait(1);
  console.log(receipt);
  // console.log(r, s, v);
}

main();
