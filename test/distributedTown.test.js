const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("DistributedTown", function () {

  let skillWalletInstance;
  let provider;
  let accounts;
  let account0;
  let account1;

  before(async function () {
    accounts = await ethers.getSigners();
    account0 = accounts[0];
    account1 = accounts[1];

    // Deploy instances
    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const ProjectFactory = await ethers.getContractFactory("Projects");
    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");
    const CommunityFactory= await ethers.getContractFactory("Community");

    const oracle = '0xb5BA7f14Fe0205593255c77875348281b44DE7BF';
    const jobId = ethers.utils.toUtf8Bytes('55d24f869f804405a4bfaff02fd52e5f')


    skillWalletInstance = await SkillWalletFactory.deploy(oracle, jobId);
    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    distributedTownInstance = await DistributedTownFactory.deploy('http://someurl.co', skillWalletInstance.address);
    await distributedTownInstance.deployed();

    await distributedTownInstance.deployGenesisCommunities(0);
    await distributedTownInstance.deployGenesisCommunities(1);
    await distributedTownInstance.deployGenesisCommunities(2);
    
    const projectsAddress = await distributedTownInstance.projectsAddress();
    projectsInstance = await ProjectFactory.attach(projectsAddress);
  })
  describe("DistributedTown", function () {

    describe.skip("createCommunity()", async function () {
      it("Should create a genesis community", async function () {
        const tx = await distributedTownInstance.createCommunity(
          "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
          0
        );
        const txReceipt = await tx.wait();
        const communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'CommunityCreated');
        const address = communityCreatedEvent.args[0];
        const tokenId = communityCreatedEvent.args[1];
        const template = communityCreatedEvent.args[2];

        const communities = await distributedTownInstance.getCommunities();
        const communityToken = await distributedTownInstance.communityAddressToTokenID(address);

        expect(communities).to.be.an('array');
        expect(communities.length).to.eq(1);
        expect(communities[0].toString()).to.eq(address);
        expect(communityToken.toString()).to.eq(tokenId.toString());
        expect(template.toString()).to.eq('0');
        expect(address.length).to.gt(0);

      });
    })
  });
});
