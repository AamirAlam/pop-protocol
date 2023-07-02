// Import the necessary dependencies
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Trading contract: ", function () {
  let popTrading;
  let owner;
  let addr1;
  let addr2;
  let addrs;
  let paymentToken;
  let DummyToken;
  let StakingContract;
  let stakingContract;
  let rewardToken;
  let tokenStaked;
  let user;
  let sequencer;

  // Deploy the POP_Trading contract and initialize accounts
  before(async function () {
    DummyToken = await ethers.getContractFactory("DummyToken");
    StakingContract = await ethers.getContractFactory("StakingContract");
    [owner, addr1, addr2, user, ...addrs] = await ethers.getSigners();
    sequencer = owner;

    rewardToken = await DummyToken.deploy(ethers.utils.parseEther("1000000"));
    await rewardToken.deployed();
    tokenStaked = await DummyToken.deploy(ethers.utils.parseEther("1000000"));
    await tokenStaked.deployed();

    stakingContract = await StakingContract.deploy(
      tokenStaked.address,
      rewardToken.address,
      owner.address,
      10,
      ethers.utils.parseEther("5000")
    );
    await stakingContract.deployed();

    paymentToken = await DummyToken.deploy(ethers.utils.parseEther("1000000"));
    await paymentToken.deployed();

    const PopTrading = await ethers.getContractFactory("Trading");
    popTrading = await PopTrading.deploy(
      paymentToken.address,
      sequencer.address,
      stakingContract.address,
      addr1.address
    );
    await popTrading.deployed();
  });

  describe("addProduct", function () {
    it("should allow the owner to add a new product", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const name = "Product 1";
      const symbol = "P1";
      const productParams = {
        supplyBase: [0, 0, 0],
        multiplicatorBase: [1, 1, 1],
        limit: 3,
        supply: 1000,
        margin: 100,
        fee: 5000,
        positionContract: "0x0000000000000000000000000000000000000000",
      };

      await expect(
        popTrading
          .connect(owner)
          .addProduct(productId, name, symbol, productParams)
      )
        .to.emit(popTrading, "ProductAdded")
        .withArgs(productId, name, symbol, productParams);

      const product = await popTrading.getProduct(productId);

      // expect(product.limit).to.equal(limit);
      // expect(product.supply).to.equal(supply);
      // expect(product.margin).to.equal(margin);
      // expect(product.fee).to.equal(fee);
      expect(product.positionContract).to.not.equal(
        ethers.constants.AddressZero
      );
    });

    it("should revert if a non-owner tries to add a new product", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_2");
      const name = "Product 2";
      const symbol = "P2";
      const limit = 5;
      const supply = 2000;
      const margin = 200;
      const fee = 2500;

      await expect(
        popTrading
          .connect(user)
          .addProduct(productId, name, symbol, limit, supply, margin, fee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if trying to add an existing product", async function () {
      const existingProductId =
        ethers.utils.formatBytes32String("EXISTING_PRODUCT");
      const name = "Existing Product";
      const symbol = "EP";
      const limit = 2;
      const supply = 3000;
      const margin = 300;
      const fee = 1500;

      await popTrading
        .connect(owner)
        .addProduct(
          existingProductId,
          name,
          symbol,
          limit,
          supply,
          margin,
          fee
        );

      await expect(
        popTrading
          .connect(owner)
          .addProduct(
            existingProductId,
            name,
            symbol,
            limit,
            supply,
            margin,
            fee
          )
      ).to.be.revertedWith("product-exists");
    });
  });

  describe("updateProduct", function () {
    it("should allow the owner to update an existing product", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const newSupply = 500;
      const newMargin = 50;
      const newFee = 2500;

      await expect(
        popTrading
          .connect(owner)
          .updateProduct(productId, newSupply, newMargin, newFee)
      )
        .to.emit(popTrading, "ProductUpdated")
        .withArgs(productId, newSupply, newMargin, newFee);

      const product = await popTrading.getProduct(productId);

      expect(product.supply).to.equal(newSupply);
      expect(product.margin).to.equal(newMargin);
      expect(product.fee).to.equal(newFee);
    });

    it("should revert if a non-owner tries to update a product", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const newSupply = 1000;
      const newMargin = 100;
      const newFee = 5000;

      await expect(
        popTrading
          .connect(user)
          .updateProduct(productId, newSupply, newMargin, newFee)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("should revert if trying to update a non-existing product", async function () {
      const nonExistingProductId = ethers.utils.formatBytes32String(
        "NON_EXISTING_PRODUCT"
      );
      const newSupply = 2000;
      const newMargin = 200;
      const newFee = 2500;

      await expect(
        popTrading
          .connect(owner)
          .updateProduct(nonExistingProductId, newSupply, newMargin, newFee)
      ).to.be.revertedWith("Product-does-not-exist");
    });
  });

  describe("Mint NFTs", function () {
    it("should allow a user to request a position", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const size = 10;
      const strikeLower = 100;
      const strikeUpper = 200;

      // Approve the Trading contract to spend payment tokens on behalf of the user
      await paymentToken
        .connect(user)
        .approve(popTrading.address, ethers.constants.MaxUint256);

      // Request a position
      await popTrading
        .connect(user)
        .requestPosition(productId, size, strikeLower, strikeUpper);

      // Get the latest mint request ID
      const requestId = await popTrading.nextMintRequestId();

      // Get the mint request associated with the request ID
      const mintRequest = await popTrading.mintRequestIdToStructure(requestId);

      // Assert the mint request details
      expect(mintRequest.receiver).to.equal(user.address);
      expect(mintRequest.productId).to.equal(productId);
      expect(mintRequest.size).to.equal(size);
      expect(mintRequest.strikeLower).to.equal(strikeLower);
      expect(mintRequest.strikeUpper).to.equal(strikeUpper);
      expect(mintRequest.totalFee).to.not.equal(0);
      expect(mintRequest.isFullFilled).to.be.false;
    });

    it("should allow the sequencer to mint a position", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const size = 10;
      const strikeLower = 100;
      const strikeUpper = 200;

      // Approve the Trading contract to spend payment tokens on behalf of the user
      await paymentToken
        .connect(user)
        .approve(popTrading.address, ethers.constants.MaxUint256);

      // Request a position
      await popTrading
        .connect(user)
        .requestPosition(productId, size, strikeLower, strikeUpper);

      // Get the latest mint request ID
      const requestId = await popTrading.nextMintRequestId();

      // Get the mint request associated with the request ID
      const mintRequest = await popTrading.mintRequestIdToStructure(requestId);

      // Sign the mint request with the sequencer address
      const sequencerSignature = await sequencer.signMessage(
        ethers.utils.arrayify(requestId)
      );

      // Mint the position as the sequencer
      await popTrading
        .connect(sequencer)
        .mintPositionSequencer(requestId, [10, 20, 30]);

      // Get the mint request after it has been fulfilled
      const updatedMintRequest = await popTrading.mintRequestIdToStructure(
        requestId
      );

      // Assert the mint request has been fulfilled
      expect(updatedMintRequest.isFullFilled).to.be.true;
      expect(updatedMintRequest.positionId).to.not.equal(0);
    });

    it("should allow a user to request burning a position", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const positionId = 1;
      const sequencerSignature = await sequencer.signMessage(
        ethers.utils.arrayify(positionId)
      );
      const owedFee = ethers.utils.parseEther("1");
      const toReturnFee = ethers.utils.parseEther("0.5");

      // Approve the Trading contract to spend payment tokens on behalf of the user
      await paymentToken
        .connect(user)
        .approve(popTrading.address, ethers.constants.MaxUint256);

      // Request burning a position
      await popTrading
        .connect(user)
        .requestBurn(
          productId,
          positionId,
          sequencerSignature,
          owedFee,
          toReturnFee
        );

      // Get the latest burn request ID
      const requestId = await popTrading.nextBurnRequestId();

      // Get the burn request associated with the request ID
      const burnRequest = await popTrading.burnRequestIdToStructure(requestId);

      // Assert the burn request details
      expect(burnRequest.burner).to.equal(user.address);
      expect(burnRequest.productId).to.equal(productId);
      expect(burnRequest.positionId).to.equal(positionId);
      expect(burnRequest.toReturnFee).to.equal(toReturnFee);
      expect(burnRequest.totalFee).to.equal(owedFee);
      expect(burnRequest.isFullFilled).to.be.false;
    });

    it("should allow the sequencer to burn a position", async function () {
      const productId = ethers.utils.formatBytes32String("PRODUCT_1");
      const positionId = 1;
      const sequencerSignature = await sequencer.signMessage(
        ethers.utils.arrayify(positionId)
      );
      const owedFee = ethers.utils.parseEther("1");
      const toReturnFee = ethers.utils.parseEther("0.5");

      // Approve the Trading contract to spend payment tokens on behalf of the user
      await paymentToken
        .connect(user)
        .approve(popTrading.address, ethers.constants.MaxUint256);

      // Request burning a position
      await popTrading
        .connect(user)
        .requestBurn(
          productId,
          positionId,
          sequencerSignature,
          owedFee,
          toReturnFee
        );

      // Get the latest burn request ID
      const requestId = await popTrading.nextBurnRequestId();

      // Burn the position as the sequencer
      await popTrading
        .connect(sequencer)
        .burnPositionSequencer(requestId, [10, 20, 30]);

      // Get the burn request after it has been fulfilled
      const updatedBurnRequest = await popTrading.burnRequestIdToStructure(
        requestId
      );

      // Assert the burn request has been fulfilled
      expect(updatedBurnRequest.isFullFilled).to.be.true;
    });
  });
});
