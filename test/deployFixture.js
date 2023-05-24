const { ethers } = require("hardhat");

// prepare dummy contract data
async function deployFixture() {
  //  token contract
  const tokenFact = await ethers.getContractFactory("Token");
  const tokenContract = await tokenFact.deploy();
  await tokenContract.deployed();

  //  trading contract
  const tradingFact = await ethers.getContractFactory("Trading");
  const tradingContract = await tradingFact.deploy(tokenContract.address);
  await tradingContract.deployed();

  //  nft contract
  const nftFact = await ethers.getContractFactory("NFT");
  const nftContract = await nftFact.deploy();
  await nftContract.deployed();

  // 4. staking contract
  const stakingFact = await ethers.getContractFactory("Staking");
  const stakingContract = await stakingFact.deploy();
  await stakingContract.deployed();

  // 5. Pool contract
  const poolFact = await ethers.getContractFactory("Pool");
  const poolContract = await poolFact.deploy();
  await poolContract.deployed();

  // Fixtures can return anything you consider useful for your tests
  return {
    tradingContract,
    tokenContract,
    nftContract,
    stakingContract,
    poolContract,
  };
}

module.exports = { deployFixture };
