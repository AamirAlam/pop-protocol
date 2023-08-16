/// YOU NEED TO ADD 'hardhat-deploy` package.
/// After done, create a folder called deploy and move this file in there.
/// Add require("hardhat-deploy"); at the top of hardhat.config
/// Run `yarn hardhat deploy`

module.exports = async ({ deployments, getNamedAccounts, ethers }) => {
  const { deploy } = deployments;
  const { deployer, userO, userT } = await getNamedAccounts();

  const Mock = await deploy("MockUSDC", {
    from: deployer,
  });
  console.log("\nDeployed USDC Mocks at :", Mock.address);

  const provider = ethers.provider;
  const signer = provider.getSigner(deployer);
  const nonOwnerSigner = provider.getSigner(userO);

  const mock = new ethers.Contract(Mock.address, Mock.abi, signer);
  await mock.mint(userO);
  await mock.mint(userT);

  const Trading = await deploy("Trading", {
    from: deployer,
    args: [Mock.address, deployer, deployer, deployer],
  });
  console.log("Deployed Trading at    :", Trading.address);

  const trading = new ethers.Contract(Trading.address, Trading.abi, signer);

  /// Adding Product : Should pass.
  var productId = ethers.utils.formatBytes32String("PRODUCT_1");
  const name = "Product 1";
  const symbol = "P1";
  const productParams = {
    supplyBase: [],
    multiplicatorBase: [],
    limit: 10,
    supply: 1000,
    margin: 100,
    fee: 5000,
    positionContract: "0x0000000000000000000000000000000000000000",
  };
  const txn = await trading.addProduct(productId, name, symbol, productParams);
  const receipt = await txn.wait(1);

  // Check the product creation params are same in the event emitted.
  // console.log(
  //   "Product created! Emitted values :",
  //   receipt.events[1].args[3],
  //   "\n"
  // );

  // Product Contract Exists : Should != 0 and pass.
  const productAdded = await trading.getProduct(productId);
  // console.log(productAdded.supplyBase);
  // console.log(productAdded.multiplicatorBase);
  // console.log(productAdded.limit);
  // console.log(productAdded.supply);
  // console.log(productAdded.margin);
  // console.log(productAdded.fee);
  console.log("Position contract address :", productAdded.positionContract);

  // Should fail if non-owner created Product : Exception while processing transaction: reverted with reason string
  // 'Ownable: caller is not the owner'
  // productId = ethers.utils.formatBytes32String("PRODUCT_2");
  // const txnFail = await trading
  //   .connect(nonOwnerSigner)
  //   .addProduct(productId, name, symbol, productParams);

  // Should fail for same Product Id being used during creation : Exception while processing transaction: reverted
  // with reason string 'product-exists
  // const txnFail = await trading.addProduct(
  //   productId,
  //   name,
  //   symbol,
  //   productParams
  // );

  // Update the Product by Owner : Should Pass.
  const fee = productAdded.fee;
  console.log("Current fee :", fee);

  // Only works for supply/margin/fee/positionContract as of v1. Can be changed if the client asks for it.
  // var updatedParams = {
  //   supplyBase: [],
  //   multiplicatorBase: [],
  //   limit: 10,
  //   supply: 1000,
  //   margin: 100,
  //   fee: 2000,
  //   positionContract: "0x0000000000000000000000000000000000000000",
  // };

  // await trading.updateProduct(productId, updatedParams);
  // const productUpdated = await trading.getProduct(productId);
  // const updatedFee = productUpdated.fee;
  // console.log("Final fee :", updatedFee);

  // Reverts if non-user tries updating the product : Fails with : VM Exception while processing transaction:
  //reverted with reason string 'Ownable: caller is not the owner'".
  // updatedParams = {
  //   supplyBase: [],
  //   multiplicatorBase: [],
  //   limit: 10,
  //   supply: 1000,
  //   margin: 100,
  //   fee: 2500,
  //   positionContract: "0x0000000000000000000000000000000000000000",
  // };
  // const txnFail = await trading
  //   .connect(nonOwnerSigner)
  //   .updateProduct(productId, updatedParams);

  // Should fail for updating non-existent products : Does fail with VM Exception while processing
  // transaction: reverted with reason string 'Product-does-not-exist'"
  // const nonExistingProductId = ethers.utils.formatBytes32String(
  //   "NON_EXISTING_PRODUCT"
  // );
  // await trading.updateProduct(nonExistingProductId, updatedParams);

  const size = ethers.BigNumber.from("10");
  const maxfee = ethers.BigNumber.from("1000000");

  const strikeLower = 100;
  const strikeUpper = 200;

  const protocolCut = size * fee;
  const vaultCut = size * (maxfee - fee);
  const toApprove = (protocolCut + vaultCut).toString();
  // console.log(toApprove.toString());
  // console.log(protocolCut, vaultCut);

  await mock.approve(Trading.address, toApprove);

  await trading.requestPosition(productId, size, strikeLower, strikeUpper);

  const mintRequest = await trading.mintRequestIdToStructure(1);
  console.log(mintRequest);
  // receiver: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  // productId: '0x50524f445543545f310000000000000000000000000000000000000000000000',
  // positionId: BigNumber { value: "0" },
  // size: BigNumber { value: "10" },
  // strikeLower: BigNumber { value: "100" },
  // strikeUpper: BigNumber { value: "200" },
  // totalFee: BigNumber { value: "10000000" },
  // isFullFilled: false
};

module.exports.tags = ["All"];
//0