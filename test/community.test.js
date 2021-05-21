const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Community", function () {

  let skillWalletInstance;
  let communityInstance;
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
    const CommunityFactory = await ethers.getContractFactory("Community");


    const oracle = '0xb5BA7f14Fe0205593255c77875348281b44DE7BF';
    const jobId = ethers.utils.toUtf8Bytes('55d24f869f804405a4bfaff02fd52e5f')


    skillWalletInstance = await SkillWalletFactory.deploy(oracle, jobId);    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    distributedTownInstance = await DistributedTownFactory.deploy('http://someurl.co', skillWalletInstance.address);
    await distributedTownInstance.deployed();
    await distributedTownInstance.deployGenesisCommunities(0);
    await distributedTownInstance.deployGenesisCommunities(1);
    await distributedTownInstance.deployGenesisCommunities(2);

    const communityAddresses = await distributedTownInstance.getCommunities();
    communityInstance = await CommunityFactory.attach(communityAddresses[0]);

    projectsInstance = await ProjectFactory.deploy(skillWalletInstance.address);
    await projectsInstance.deployed();
  });
  describe("joinNewMember()", function () {
    it("Should be able to add the new member to the community", async function () {
      const [owner] = await ethers.getSigners();
      const userAddress = owner.address;
      let credits = ethers.utils.parseEther("2006");
      const a = await communityInstance.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', credits);
      const txReceipt = await a.wait();

      const memberAddedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
      const tokenId = memberAddedEvent.args[1];
      const membersCount = await communityInstance.activeMembersCount()
      const isMember = await communityInstance.isMember(userAddress)
      const skillWalletIds = await communityInstance.getMembers();

      const skillWalletRegistered = await skillWalletInstance.isSkillWalletRegistered(userAddress);
      const skillWalletId = await skillWalletInstance.getSkillWalletIdByOwner(userAddress);
      const skillWalletActiveCommunity = await skillWalletInstance.getActiveCommunity(tokenId);
      const skillWalletCommunityHistory = await skillWalletInstance.getCommunityHistory(tokenId);
      const skillWalletSkillSet = await skillWalletInstance.getSkillSet(tokenId);
      const skillWalletActivated = await skillWalletInstance.isSkillWalletActivated(tokenId);

      const twoBn = ethers.BigNumber.from(2);
      expect(skillWalletRegistered).to.be.equal(true);
      expect(skillWalletId).to.be.equal(tokenId);
      expect(skillWalletActiveCommunity).to.be.equal(communityInstance.address);
      expect(skillWalletActivated).to.be.equal(false);
      expect(skillWalletSkillSet['skill2']['displayStringId']).to.be.equal(twoBn);
      expect(skillWalletSkillSet['skill2']['level']).to.be.equal(twoBn);
      expect(skillWalletCommunityHistory[0]).to.be.equal(communityInstance.address);

      expect(membersCount).to.eq(2);
      expect(isMember).to.be.true;
      expect(skillWalletIds).to.be.an('array');
      //The first skill wallet ID is the treasury
      expect(skillWalletIds[1].toString()).to.eq(tokenId.toString());
    });
  });
});
