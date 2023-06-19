const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { deployFixture } = require("./deployFixture");

// test cases for the contract

describe("NFT contract: ", async function () {
  it("deployed nft contract", async function () {
    // const { nftContract } = await loadFixture(deployFixture);
    // console.log("nftContract contract address: ", nftContract.address);
    // expect(typeof nftContract.address).to.equal("string");
  });
});
