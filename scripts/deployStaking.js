const { ethers } = require("hardhat");

async function main() {
  const stakingFactory = await ethers.getContractFactory("StakingContract");

  const tokenStaked = "";
  const rewardToken = "";
  const tradingContract = "";
  const initialAPR = 0;
  const initialStakingTarget = 0;

  const Staking = await stakingFactory.deploy(
    tokenStaked,
    rewardToken,
    tradingContract,
    initialAPR,
    initialStakingTarget
  );
  await Staking.deployed();
  console.log("Staking:", Staking.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
