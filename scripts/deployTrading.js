const { ethers } = require("hardhat");

async function main() {
  const TradingFact = await ethers.getContractFactory("POP_Trading");

  const usdcFaucet = "0x2ddb853a09d4Da8f0191c5B887541CD7af3dDdce";
  const sequencer = "0x8BD0e959E9a7273D465ac74d427Ecc8AAaCa55D8";
  const stakingContract = "0xd9329eA2f5e4f9942872490b185f17e442122f28";

  const tradingContract = await TradingFact.deploy(
    usdcFaucet,
    sequencer,
    stakingContract
  );
  await tradingContract.deployed();
  console.log("tradingContract deployed at:", tradingContract.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
//0