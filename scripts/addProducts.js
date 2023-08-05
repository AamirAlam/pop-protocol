const { ethers } = require("hardhat");

async function main() {
  const TradingFact = await ethers.getContractFactory("POP_Trading");

  const tradingContractInstance = TradingFact.attach(
    "0xBD4B78B3968922e8A53F1d845eB3a128Adc2aA12"
  );

  console.log("tradingContract loaded at:", tradingContractInstance.address);

  for (let i = 4; i <= 10; i++) {
    const productId = ethers.utils.formatBytes32String(`PRODUCT_${i}`);
    const name = `Product ${i}`;
    const symbol = `P${i}`;
    const productParams = {
      supplyBase: [0, 0, 0],
      multiplicatorBase: [1, 1, 1],
      limit: 3,
      supply: 1000,
      margin: 100,
      fee: 5000,
      positionContract: "0x0000000000000000000000000000000000000000",
    };

    await tradingContractInstance.addProduct(
      productId,
      name,
      symbol,
      productParams
    );

    const product = await tradingContractInstance.getProduct(productId);
    console.log("product added ", product);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
