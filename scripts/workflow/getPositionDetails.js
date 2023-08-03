const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// The address is for the PRODUCT 1
const positionAddress = "0x70A26a64b21461D190945dCbD9e8495c46306157";
const {
  abi: positionABI,
} = require("../artifacts/contracts/Positions.sol/POP_Positions.json");

const { ethers } = require("ethers");

const PROVIDER = process.env.MUMBAI_RPC;
const OWNER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(OWNER, provider);

const positions = new ethers.Contract(positionAddress, positionABI, wallet);

async function getPositionDetails(id) {
  try {
    const position = await positions.getPosition(id);
    console.log(position);
  } catch (err) {
    console.log(err);
  }
}

async function main() {
  await getPositionDetails(2);
}

main();
