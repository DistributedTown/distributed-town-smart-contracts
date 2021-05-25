const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe.only("PartnersAgreemeent", function () {

  let skillWalletInstance;
  let distributedTownInstance;
  let partnersAgreementInstance;
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
    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");
    const CommunityFactory = await ethers.getContractFactory("Community");

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

    const communityAddresses = await distributedTownInstance.getCommunities();
    communityInstance = await CommunityFactory.attach(communityAddresses[0]);
  });


  describe("create()", function () {
    it("Should be able to create a partners agreement", async function () {
      const [owner] = await ethers.getSigners();
      const userAddress = owner.address;
      let credits = ethers.utils.parseEther("2006");
      const a = await partnersAgreementInstance.create(
          'http://swUri.id', 
          'http://comUri.id',
          '0x1aE7CeDf6b3468F30be1d2fa0437F7227a809DCA',
          'TestToken',
          'TST',
          1
      );
      const txReceipt = await a.wait();

      const partnersAgrCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'PartnersAggreementCreated');
      const comAddr = partnersAgrCreatedEvent.args[0];
      const swId = partnersAgrCreatedEvent.args[1];

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
      expect(skillWalletSkillSet['skill2']['skillId']).to.be.equal(twoBn);
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
