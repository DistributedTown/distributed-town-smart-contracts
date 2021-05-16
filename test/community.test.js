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

    skillWalletInstance = await SkillWalletFactory.deploy();
    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    skillWalletInstance = await SkillWalletFactory.deploy();
    await skillWalletInstance.deployed();

    distributedTownInstance = await DistributedTownFactory.deploy('http://someurl.co', skillWalletInstance.address);
    await distributedTownInstance.deployed();
    await distributedTownInstance.deployGenesisCommunities();

    const communityAddresses = await distributedTownInstance.getCommunities();
    communityInstance = await CommunityFactory.attach(communityAddresses[0]);

    projectsInstance = await ProjectFactory.deploy(skillWalletInstance.address);
    await projectsInstance.deployed();
  });
  describe("joinNewMember()", function () {
    it("Should be able to add the new member to the community", async function () {
      const accounts = await ethers.getSigners();
      let userAddress = ethers.utils.getAddress(accounts[4].address);
      let credits = ethers.utils.parseEther("2006");
      const a = await communityInstance.joinNewMember(userAddress, 1, 1, 2, 2, 3, 3, 'http://someuri.co', credits);
      const txReceipt = await a.wait();

      const memberAddedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
      const tokenId = memberAddedEvent.args[1];
      const membersCount = await communityInstance.activeMembersCount()
      const isMember = await communityInstance.isMember(tokenId)
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
