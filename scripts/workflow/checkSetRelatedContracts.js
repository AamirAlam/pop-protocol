const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const {
  address: tradingAddress,
  abi: tradingABI,
} = require("../deployments/mumbai/POP_Trading.json");

const { ethers } = require("ethers");

const PROVIDER = process.env.MUMBAI_RPC;
const OWNER = process.env.PK_DEPLOYER;

const provider = new ethers.providers.JsonRpcProvider(PROVIDER);
const wallet = new ethers.Wallet(OWNER, provider);

async function getRelatedContracts() {
  try {
    const contract = new ethers.Contract(tradingAddress, tradingABI, wallet);
    const sequencerAddress = await contract.sequencerAddress();
    const stakingAddress = await contract.vaultStakingAddress();
    console.log("Addresses result :", sequencerAddress, stakingAddress);
  } catch (error) {
    console.error("Error calling test function:", error);
  }
}

async function setSeq() {
  try {
    const contract = new ethers.Contract(tradingAddress, tradingABI, wallet);
    const newSeq = process.env.PUB_SEQUENCER;
    const txn = await contract.setSequencer(newSeq);
    await txn.wait(1);

    const sequencerAddress = await contract.sequencerAddress();
    console.log("New Sequencer result:", sequencerAddress);
  } catch (error) {
    console.error("Error calling test function:", error);
  }
}

async function setStk() {
  try {
    const contract = new ethers.Contract(tradingAddress, tradingABI, wallet);
    const newStk = process.env.PUB_VAULTSTAKING;
    const txn = await contract.setVaultStaking(newStk);
    await txn.wait(1);

    const stakingAddress = await contract.vaultStakingAddress();
    console.log("New Vault Staking result:", stakingAddress);
  } catch (error) {
    console.error("Error calling test function:", error);
  }
}

getRelatedContracts();
// setSeq();
// setStk();
