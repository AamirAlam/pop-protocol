const { ethers } = require("hardhat");
const { expect } = require("chai");

describe("StakingContract", function () {
  let StakingContract, DummyToken;
  let stakingContract;
  let rewardToken, tokenStaked;
  let owner, addr1, addr2, addrs;

  beforeEach(async function () {
    DummyToken = await ethers.getContractFactory("DummyToken");
    StakingContract = await ethers.getContractFactory("StakingContract");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

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
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await stakingContract.tradingContract()).to.equal(owner.address);
    });

    it("Should set the correct token addresses", async function () {
      expect(await stakingContract.tokenStaked()).to.equal(tokenStaked.address);
      expect(await stakingContract.rewardToken()).to.equal(rewardToken.address);
    });
  });

  describe("Staking", function () {
    it("Should allow owner to stake tokens", async function () {
      await tokenStaked.approve(
        stakingContract.address,
        ethers.utils.parseEther("100")
      );
      await stakingContract.stake(ethers.utils.parseEther("100"));
      expect(await stakingContract.totalStakedAmount()).to.equal(
        ethers.utils.parseEther("100")
      );
    });

    it("Should fail if user tries to stake more tokens than they have", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await expect(
        stakingContract.connect(addr1).stake(ethers.utils.parseEther("200"))
      ).to.be.reverted;
    });

    it("Should allow user to stake tokens", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenStaked
        .connect(addr1)
        .approve(stakingContract.address, ethers.utils.parseEther("100"));
      await stakingContract
        .connect(addr1)
        .stake(ethers.utils.parseEther("100"));
      expect(await stakingContract.stakedAmount(addr1.address)).to.equal(
        ethers.utils.parseEther("100")
      );
    });
  });

  describe("Unstaking", function () {
    it("Should fail if user tries to unstake without initiating unstake", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenStaked
        .connect(addr1)
        .approve(stakingContract.address, ethers.utils.parseEther("100"));
      await stakingContract
        .connect(addr1)
        .stake(ethers.utils.parseEther("100"));
      await expect(stakingContract.connect(addr1).unstake()).to.be.revertedWith(
        "Unstake not initiated"
      );
    });

    it("Should allow user to unstake after initiating unstake and waiting for unstake epoch", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenStaked
        .connect(addr1)
        .approve(stakingContract.address, ethers.utils.parseEther("100"));
      await stakingContract
        .connect(addr1)
        .stake(ethers.utils.parseEther("100"));
      await stakingContract.connect(addr1).initiateUnstake();

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // simulate 7 days passing
      await ethers.provider.send("evm_mine"); // mine the next block
      await stakingContract.connect(addr1).unstake();
      expect(await stakingContract.stakedAmount(addr1.address)).to.equal(0);
    });
  });

  describe("Rewards", function () {
    it("Should correctly calculate rewards after 7 days", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenStaked
        .connect(addr1)
        .approve(stakingContract.address, ethers.utils.parseEther("100"));
      await stakingContract
        .connect(addr1)
        .stake(ethers.utils.parseEther("100"));
      await rewardToken.approve(
        stakingContract.address,
        ethers.utils.parseEther("10000")
      );
      await rewardToken.transfer(
        stakingContract.address,
        ethers.utils.parseEther("10000")
      );
      await stakingContract
        .connect(owner)
        .sendFeeToVault(ethers.utils.parseEther("9000"));

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // simulate 7 days passing
      await ethers.provider.send("evm_mine"); // mine the next block

      await stakingContract.connect(addr1).updateFinalRewards(addr1.address);
      expect(await stakingContract.rewardsEarned(addr1.address)).to.equal(
        ethers.utils.parseEther("10")
      ); // 10% APR, so 10 tokens over 7 days
    });

    it("Should allow user to claim rewards", async function () {
      await tokenStaked.transfer(addr1.address, ethers.utils.parseEther("100"));
      await tokenStaked
        .connect(addr1)
        .approve(stakingContract.address, ethers.utils.parseEther("100"));
      await stakingContract
        .connect(addr1)
        .stake(ethers.utils.parseEther("100"));

      await ethers.provider.send("evm_increaseTime", [7 * 24 * 60 * 60]); // simulate 7 days passing
      await ethers.provider.send("evm_mine"); // mine the next block

      await rewardToken.transfer(
        stakingContract.address,
        ethers.utils.parseEther("100")
      ); // deposit reward tokens in staking contract
      await stakingContract.connect(addr1).updateFinalRewards(addr1.address);
      await stakingContract.connect(addr1).claimRewards();
      expect(await rewardToken.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseEther("10")
      ); // 10% APR, so 10 tokens over 7 days
    });

    it("Should not allow users to claim rewards if they have not earned any", async function () {
      await expect(
        stakingContract.connect(addr1).claimRewards()
      ).to.be.revertedWith("No rewards!");
    });
  });

  // describe("Epoch updates", function () {
  //   it("Should correctly update the epoch", async function () {
  //     const initialAPR = await stakingContract.currentAPR();
  //     const initialStakingTarget = await stakingContract.currentStakingTarget();

  //     // Mint and stake some tokens for addr1
  //     await tokenStaked
  //       .connect(addr1)
  //       .approve(stakingContract.address, ethers.utils.parseEther("1000"));
  //     await stakingContract
  //       .connect(addr1)
  //       .stake(ethers.utils.parseEther("1000"));

  //     await ethers.provider.send("evm_increaseTime", [604800]); // Increase time by one week
  //     await ethers.provider.send("evm_mine"); // Mine the next block

  //     await stakingContract.updateEpoch();

  //     expect(await stakingContract.currentAPR()).to.equal(initialAPR - 1);
  //     expect(await stakingContract.currentStakingTarget()).to.equal(
  //       (initialStakingTarget * 110) / 100
  //     );
  //   });
  // });

  describe("Contract balances", function () {
    it("Should return the correct total staked amount", async function () {
      // Mint and stake some tokens for addr1
      await tokenStaked.approve(
        stakingContract.address,
        ethers.utils.parseEther("100")
      );
      await stakingContract.stake(ethers.utils.parseEther("100"));

      expect(await stakingContract.totalStakedAmount()).to.equal(
        ethers.utils.parseEther("100")
      );
    });

    // it("Should return the correct reward token balance", async function () {
    //   // Mint and stake some tokens for addr1, and let the staking contract earn some reward tokens
    //   await tokenStaked.approve(
    //     stakingContract.address,
    //     ethers.utils.parseEther("100")
    //   );
    //   await stakingContract.stake(ethers.utils.parseEther("100"));

    //   await ethers.provider.send("evm_increaseTime", [604800]); // Increase time by one week
    //   await ethers.provider.send("evm_mine"); // Mine the next block

    //   await stakingContract.updateFinalRewards(addr1.address);

    //   expect(await stakingContract.totalUSDCVaultBalance()).to.be.above(0);
    // });
  });
});
