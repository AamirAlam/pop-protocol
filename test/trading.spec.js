const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployFixture } = require("./deployFixture");

// test cases for the contract

describe("Trading contract: ", async function () {
  it("deployed trading contract", async function () {
    const { tradingContract } = await loadFixture(deployFixture);
    // console.log("trading contract address: ", tradingContract.address);

    expect(typeof tradingContract.address).to.equal("string");
  });
});
