const { ethers } = require("hardhat");

async function main() {
  const TradingFact = await ethers.getContractFactory("POP_Trading");

  const tradingContractInstance = TradingFact.attach(
    "0xBD4B78B3968922e8A53F1d845eB3a128Adc2aA12"
  );

  const UsdcFact = await ethers.getContractFactory("MockUSDC");
  const usdc = UsdcFact.attach("0x2ddb853a09d4Da8f0191c5B887541CD7af3dDdce");

  // Approve the Trading contract to spend payment tokens on behalf of the user

  const productId = ethers.utils.formatBytes32String("PRODUCT_1");
  const productAdded = await tradingContractInstance.getProduct(productId);

  const fee = productAdded.fee;
  const size = "10";
  const maxfee = "1000000";
  const strikeLower = 100;
  const strikeUpper = 200;

  const protocolCut = size * fee;
  const vaultCut = size * (maxfee - fee);
  const toApprove = (protocolCut + vaultCut).toString();

  await usdc.approve(tradingContractInstance.address, toApprove);

  // Request a position
  const trx = await tradingContractInstance.requestPosition(
    productId,
    size,
    strikeLower,
    strikeUpper
  );

  console.log("req trx", trx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
