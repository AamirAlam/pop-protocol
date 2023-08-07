const { ethers } = require("hardhat");
const { PerpetualOptionsProtocol } = require("./lambda");

async function main() {
  const TradingFact = await ethers.getContractFactory("POP_Trading");

  const tradingContractInstance = TradingFact.attach(
    "0xBD4B78B3968922e8A53F1d845eB3a128Adc2aA12"
  );

  const productId = ethers.utils.formatBytes32String("PRODUCT_2");
  const productAdded = await tradingContractInstance.getProduct(productId);

  const fee = productAdded.fee;

  const size = "10";
  const maxfee = "1000000";
  const strikeLower = 100;
  const strikeUpper = 200;

  const requestId = "2";
  const limit = 5;

  const helper = PerpetualOptionsProtocol(strikeLower, strikeUpper, limit);

  console.log("helpers ", helper);
  const positions = helper.mint(strikeLower, strikeUpper, size, fee);

  console.log("positions array ", positions);

  const trx = await tradingContractInstance.mintPositionSequencer(
    requestId,
    positions
  );

  console.log("req trx", trx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
