const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

// The address is for the PRODUCT 1
const positionAddress = "0xF6F142Cd0AE69c42A4774C1a5bfc561d678A57e9";
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
  await getPositionDetails(1);
}

main();
