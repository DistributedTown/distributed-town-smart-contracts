const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("DistributedTown", function () {
  let communityRegistryContract;

  describe("CommunityRegistry", function () {
    it("Should deploy CommunityRegistry", async function () {
      const CommunityRegistryContract = await ethers.getContractFactory("CommunitiesRegistry");

      communityRegistryContract = await CommunityRegistryContract.deploy('0x89AB41fceb97324BEf2Aa5d5048F13b71b8fbca2');
    });

    describe("getCommunities()", function () {
      it("Should be able to get the communities", async function () {
        const communities = await communityRegistryContract.getCommunities();
        expect(communities).to.be.an('array');
      });
    });
  });
});
