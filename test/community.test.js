const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("DistributedTown", function () {

  let communityRegistryInstance;
  let skillWalletInstance;
  let gigsInstance;
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
    const ProjectFactory = await ethers.getContractFactory("Project");
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

    projectsInstance = await ProjectFactory.deploy();
    await projectsInstance.deployed();

    // Create genesis community
    const community = await distributedTownInstance.createCommunity(
      "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
      0
    );

    const txReceipt = await community.wait();

    const communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'CommunityCreated');
    const communityAddress = communityCreatedEvent.args[0];

    communityInstance = await CommunityFactory.attach(communityAddress);
    console.log('community address');
    console.log(communityAddress);

  })


  describe("createSkillWallet()", function () {
    // it("Should create a new skill wallet", async function () {

    //   const communities = await distributedTownInstance.templateCommunities(0, 0);
    //   // join community as new member
    //   const accounts = await ethers.getSigners();
    //   let userAddress = ethers.utils.getAddress(accounts[0].address);
    //   let credits = ethers.utils.parseEther("2006");
    //   await communityInstance.joinNewMember(userAddress, 1, 1, 2, 2, 3, 3, 'http://someuri.co', credits)
    //   const membersCount = await communityInstance.activeMembersCount()
    //   const isMember = await communityInstance.isMember(ethers.BigNumber.from(0))
    //   const skillWalletIds = await communityInstance.getSkillWalletIds();
    //   console.log('skillWalletIds');
    //   console.log(skillWalletIds);

    //   const member = await skillWalletInstance.getSkillWalletIdByOwner(userAddress);
    //   console.log('member');
    //   console.log(member.toString());
    //   expect(membersCount).to.eq(1);
    //   expect(isMember).to.be.true;
    //   expect(skillWalletIds).to.be.an('array');
    //   expect(skillWalletIds.length).to.eq(1);
    // });
  });
  describe("joinNewMember()", function () {
    it("Should be able to add the new member to the community", async function () {
      const accounts = await ethers.getSigners();
      let userAddress = ethers.utils.getAddress(accounts[4].address);
      let credits = ethers.utils.parseEther("2006");
      const a = await communityInstance.joinNewMember(userAddress, 1, 1, 2, 2, 3, 3, 'http://someuri.co', credits);
      const txReceipt = await a.wait();

      const communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
      const tokenId = communityCreatedEvent.args[1];
      const membersCount = await communityInstance.activeMembersCount()
      const isMember = await communityInstance.isMember(tokenId)
      const skillWalletIds = await communityInstance.getMembers();

      const skillWalletRegistered = await skillWalletInstance.isSkillWalletRegistered(userAddress);
      const skillWalletId = await skillWalletInstance.getSkillWalletIdByOwner(userAddress);
      const skillWalletActiveCommunity = await skillWalletInstance.getActiveCommunity(0);
      const skillWalletCommunityHistory = await skillWalletInstance.getCommunityHistory(0);
      const skillWalletSkillSet = await skillWalletInstance.getSkillSet(0);
      const skillWalletActivated = await skillWalletInstance.isSkillWalletActivated(0);

      const twoBn = ethers.BigNumber.from(2);
      expect(skillWalletRegistered).to.be.equal(true);
      expect(skillWalletId).to.be.equal(ethers.BigNumber.from(0));
      expect(skillWalletActiveCommunity).to.be.equal(communityInstance.address);
      expect(skillWalletActivated).to.be.equal(false);
      expect(skillWalletSkillSet['skill2']['displayStringId']).to.be.equal(twoBn);
      expect(skillWalletSkillSet['skill2']['level']).to.be.equal(twoBn);
      expect(skillWalletCommunityHistory[0]).to.be.equal(communityInstance.address);


      expect(membersCount).to.eq(1);
      expect(isMember).to.be.true;
      expect(skillWalletIds).to.be.an('array');
      expect(skillWalletIds[0].toString()).to.eq(tokenId.toString());
    });
  });
});
