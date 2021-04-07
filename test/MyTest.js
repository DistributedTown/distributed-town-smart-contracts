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

    describe("createCommunity()", async function () {
      it("Should create a genesis community", async function () {
        const community = await communityRegistryContract.createCommunity(
            "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
            0,
            0,
            'GenesisTown',
            3,
            6,
            12,
            24
        );
        const communities = await communityRegistryContract.getCommunities();
        const numOfComs = await communityRegistryContract.numOfCommunities();
        expect(numOfComs).to.eq(1);
        expect(communities).to.be.an('array');
        expect(communities.length).to.eq(1);
      });
    })

    describe("getCommunities()", function () {
      it("Should be able to get the communities", async function () {
        const communities = await communityRegistryContract.getCommunities();
        expect(communities).to.be.an('array');
      });
    });
  });
});
