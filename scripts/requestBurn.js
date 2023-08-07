const { ethers } = require("hardhat");

async function getSequencerRSV(positionId, productId) {
  try {
    const owner = ethers.getSigner();

    // const message = `Position ${positionId} Product ${productId}`;

    const payload = ethers.utils.defaultAbiCoder.encode(
      ["string", "bytes32", "string", "uint256"],
      ["Product:", productId, "Position:", positionId]
    );
    const payloadHash = ethers.utils.keccak256(payload);

    const toCheck = ethers.utils.solidityKeccak256(
      ["string", "bytes32"],
      ["\x19Ethereum Signed Message:\n32", payloadHash]
    );
    console.log(toCheck);

    // Sign the message using the wallet
    const signature = await owner.signMessage(
      ethers.utils.arrayify(payloadHash)
    );

    const sig = ethers.utils.splitSignature(signature);
    const r = sig.r;
    const s = sig.s;
    const v = sig.v;

    return [toCheck, r, s, v];
  } catch (err) {
    console.error(err);
  }
}

async function main() {
  const TradingFact = await ethers.getContractFactory("POP_Trading");

  const tradingContractInstance = TradingFact.attach(
    "0xBD4B78B3968922e8A53F1d845eB3a128Adc2aA12"
  );

  const UsdcFact = await ethers.getContractFactory("MockUSDC");
  const usdc = UsdcFact.attach("0x2ddb853a09d4Da8f0191c5B887541CD7af3dDdce");

  // Approve the Trading contract to spend payment tokens on behalf of the user

  // const productId = ethers.utils.formatBytes32String("PRODUCT_1");
  // const productAdded = await tradingContractInstance.getProduct(productId);

  // ASSUMING THE FEE FOR NOW. WILL BE CALCULATED ON THE FRONTEND.
  const owed = "1000000";
  const toReturn = "200000";
  const approveSuccess = await usdc.approve(
    tradingContractInstance.address,
    owed
  );

  // already minted nft
  const positionPair =
    "0x0bc97c0fcc383ee8dea670dd25422c5ee35783724cc8d53729a7bef1b3dcfce6";
  const decoded = ethers.utils.defaultAbiCoder.decode(
    ["bytes32", "bytes32"],
    positionPair
  );

  const productId = decoded[0];
  const positionId = decoded[1];

  console.log("productId", productId);
  console.log("positionId", positionId);

  // const [toCheck, r, s, v] = await getSequencerRSV(requestId, productId);

  // const txn = await tradingContractInstance.requestBurn(
  //   productId,
  //   requestId,
  //   toCheck,
  //   v,
  //   r,
  //   s,
  //   owed,
  //   toReturn,
  //   {
  //     gasLimit: 10000000,
  //   }
  // );

  console.log("req trx", trx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
