const { ethers } = require("hardhat");
const { BN } = require("./helpers");

// prepare dummy contract data
async function deployFixture() {
  // console.log("deploying.......");
  //  token contract
  const usdcFact = await ethers.getContractFactory("Token");
  const usdcContract = await usdcFact.deploy(
    "USDC",
    "US doller",
    18,
    BN("1000000000").toString()
  );
  await usdcContract.deployed();

  // console.log("deployed token contract address ", usdcContract.address);
  //  trading contract
  const tradingFact = await ethers.getContractFactory("Trading");
  const tradingContract = await tradingFact.deploy(usdcContract.address);
  await tradingContract.deployed();

  // //  nft contract
  const nftFact = await ethers.getContractFactory("NFT");
  const nftContract = await nftFact.deploy();
  await nftContract.deployed();

  // // 5. Pool contract
  const poolFact = await ethers.getContractFactory("Pool");
  const poolContract = await poolFact.deploy(usdcContract.address);
  await poolContract.deployed();

  // // 4. staking contract
  const stakingFact = await ethers.getContractFactory("Staking");
  const stakingContract = await stakingFact.deploy(
    poolContract.address,
    usdcContract.address
  );
  await stakingContract.deployed();

  // Fixtures can return anything you consider useful for your tests
  return {
    tradingContract,
    usdcContract,
    nftContract,
    stakingContract,
    poolContract,
  };
}

module.exports = { deployFixture };
