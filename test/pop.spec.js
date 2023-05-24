const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployFixture } = require("./deployFixture");

// test cases for the contract

describe("POP protocol: ", function () {
  it("trading contract", async function () {
    const { tradingContract } = await loadFixture(deployFixture);

    console.log("trading contract address: ", tradingContract.address);
    expect(true).to.be(true);
  });
});
