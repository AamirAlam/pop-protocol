const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployFixture } = require("./deployFixture");

// test cases for the contract

describe("Pool Contract: ", async function () {
  it("deployed pool contract", async function () {
    const { poolContract } = await loadFixture(deployFixture);

    expect(typeof poolContract.address).to.equal("string");
  });
});
