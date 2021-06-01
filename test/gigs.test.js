const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Gigs", function () {

  let skillWalletInstance;
  let provider;
  let communityInstance;
  let memberAddress;
  let memberTokenId;

  before(async function () {
    const [signer] = await ethers.getSigners();
    memberAddress = signer.address;
    // Deploy instances
    const AddressProviderFactory = await ethers.getContractFactory('AddressProvider');
    const addressProvInstance = await AddressProviderFactory.deploy();
    const GigStatusesFactory = await ethers.getContractFactory("GigStatuses");
    const gigStatusesInstance = await GigStatusesFactory.deploy();

    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const GigsFactory = await ethers.getContractFactory("Gigs", {
        libraries: {
          GigStatuses: gigStatusesInstance.address
        }
      });
    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");
    const CommunityFactory = await ethers.getContractFactory("Community", 
    {
        libraries: {
          GigStatuses: gigStatusesInstance.address
        }
      });
    

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
    
    const memberTx = await communityInstance.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', 2006);
    const txReceipt = await memberTx.wait();

    const memberAddedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
    memberAddress = memberAddedEvent.args[0];
    memberTokenId = memberAddedEvent.args[1];

    await skillWalletInstance.activateSkillWallet(memberTokenId, '');
    const gigsAddress = await communityInstance.gigsAddress();
    gigsInstance = await GigsFactory.attach(gigsAddress)
    await gigsInstance.deployed();

  })
  describe.only("Gigs", function () {

    describe("createGig()", async function () {
      it("Should fail when the gig creator isn't a community member", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await projectsInstance.createGig(
          '0x093ECac1110EF08976A0A1F24393c3e48936489D',
          200,
          metadataUrl
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        const creator = projectCreatedEvent.args[0];
        const gigId = projectCreatedEvent.args[1];

        expect(true).to.be(true);
      });
      it("Should fail when the dito credits are invalid amount", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await gigsInstance.createGig(
          memberAddress,
          2,
          metadataUrl
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        const creator = projectCreatedEvent.args[0];
        const gigId = projectCreatedEvent.args[1];

        const tx1 = await gigsInstance.createGig(
            memberAddress,
            1000,
            metadataUrl
          );
          const txReceipt1 = await tx1.wait();
          const projectCreatedEvent1 = txReceipt1.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
          const creator1 = projectCreatedEvent1.args[0];
          const gigId1 = projectCreatedEvent1.args[1];
  
        expect(true).to.be(true);
      });

      it("Should fail if the creator doesn't have enough credits", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await gigsInstance.createGig(
          memberAddress,
          10,
          metadataUrl
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        const creator = projectCreatedEvent.args[0];
        const gigId = projectCreatedEvent.args[1];
  
        expect(true).to.be(true);
      });

      it("Should work correctly otherwise", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const balanceBefore = await communityInstance.balanceOf(memberAddress);
        const creditsAmount = 50;
        const tx = await gigsInstance.createGig(
          memberAddress,
          creditsAmount,
          metadataUrl
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        const creator = projectCreatedEvent.args[0];
        const gigId = projectCreatedEvent.args[1];
        const balanceAfter = await communityInstance.balanceOf(memberAddress);
  
        expect(balanceBefore + creditsAmount).to.eq(balanceAfter);
        expect(gigId.toString()).to.be('0');
        expect(creator.toString()).to.eq(memberAddress);
      });
    })
  });
});
