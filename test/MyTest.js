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
  const skillWalletContractName = "SkillWallet";
  const skillWalletContractSymbol = "SW";

  before(async function () {
    accounts = await ethers.getSigners();
    account0 = accounts[0];
    account1 = accounts[1];

    // Deploy instances
    const CommunityRegistryFactory = await ethers.getContractFactory("CommunitiesRegistry");

    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");
    const GigsFactory = await ethers.getContractFactory("Gigs");
    const CommunityFactory = await ethers.getContractFactory("Community");

    skillWalletInstance = await SkillWalletFactory.deploy();
    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    communityRegistryInstance = await CommunityRegistryFactory.deploy(skillWalletInstance.address);
    await communityRegistryInstance.deployed();

    gigsInstance = await GigsFactory.deploy();
    await gigsInstance.deployed();

    // Create genesis community
    const community = await communityRegistryInstance.createCommunity(
        "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
        0,
        0,
        'GenesisTown',
        3,
        6,
        12,
        24
    );

    const txReceipt = await community.wait();

    const communityCreatedEvent = txReceipt.events.find(txReceiptEvent =>  txReceiptEvent.event === 'CommunityCreated');
    const communityAddress = communityCreatedEvent.args[0];

    communityInstance = await CommunityFactory.attach(communityAddress);
    console.log('community address');
    console.log(communityAddress);

})
  describe("CommunityRegistry", function () {
    // it("Should deploy CommunityRegistry", async function () {
    //   const CommunityRegistryContract = await ethers.getContractFactory("CommunitiesRegistry");
    //   communityRegistryContract = await CommunityRegistryContract.deploy('0x89AB41fceb97324BEf2Aa5d5048F13b71b8fbca2');
    // });

    // describe("createCommunity()", async function () {
    //   it("Should create a genesis community", async function () {
    //     const community = await communityRegistryContract.createCommunity(
    //       "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
    //       0,
    //       0,
    //       'GenesisTown',
    //       3,
    //       6,
    //       12,
    //       24
    //     );
    //     const communities = await communityRegistryContract.getCommunities();
    //     const numOfComs = await communityRegistryContract.numOfCommunities();
    //     expect(numOfComs).to.eq(1);
    //     expect(communities).to.be.an('array');
    //     expect(communities.length).to.eq(1);
    //   });
    // })

    describe("getCommunities()", function () {
      it("Should be able to get the communities", async function () {
        const communities = await communityRegistryInstance.getCommunities();
        expect(communities).to.be.an('array');
      });
    });

    describe("joinNewMember()", function () {
      it("Should be able to add the new member to the community", async function () {
        
        const communities = await communityRegistryInstance.getCommunities();
        // join community as new member
        const accounts = await ethers.getSigners();
        let userAddress = ethers.utils.getAddress(accounts[0].address);
        let credits = ethers.utils.parseEther("2006");
        // let one_bn = ethers.BigNumber.from(1);
        // let skill = [one_bn, one_bn]
        // let skillSet = [skill, skill, skill];
        const a = await communityRegistryInstance.joinNewMember(communities[0], 1, 1, 2, 2 ,3 ,3 , '', credits)
        // console.log(a);
        const membersCount = await communityInstance.activeMembersCount()
        const isMember = await communityInstance.isMember(ethers.BigNumber.from(0))
        const skillWalletIds = await communityInstance.getSkillWalletIds();
        console.log('skillWalletIds');
        console.log(skillWalletIds);

        const member = await skillWalletInstance.getSkillWalletIdByOwner(userAddress);
        console.log('member');
        console.log(member.toString());
        expect(membersCount).to.eq(1);
        expect(isMember).to.be.true;
        // expect(skillWalletIds).to.be.an('array');
        // expect(skillWalletIds.length).to.eq(1);
      });
    });
  });
});
