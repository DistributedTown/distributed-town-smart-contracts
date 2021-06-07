const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");
// const { singletons } = require('@openzeppelin/test-environment');

use(solidity);

describe("Gigs", function () {

  let skillWalletInstance;
  let provider;
  let communityInstance;
  let gigsInstance;
  let memberAddress;
  let memberTokenId;
  let distributedTownInstsance;
  let gigStatusesInstance;

  const deployDistrbutedTown = async () => {
    const GigStatusesFactory = await ethers.getContractFactory("GigStatuses");
    gigStatusesInstance = await GigStatusesFactory.deploy();

    const AddressProviderFactory = await ethers.getContractFactory('AddressProvider',
      {
        libraries: {
          GigStatuses: gigStatusesInstance.address
        }
      });

    const addressProvInstance = await AddressProviderFactory.deploy();
    await addressProvInstance.deployed();


    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");

    const oracle = '0xb5BA7f14Fe0205593255c77875348281b44DE7BF';
    const jobId = ethers.utils.toUtf8Bytes('55d24f869f804405a4bfaff02fd52e5f')

    skillWalletInstance = await SkillWalletFactory.deploy(oracle, jobId);

    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    distributedTownInstance = await DistributedTownFactory.deploy('http://someurl.co', skillWalletInstance.address, addressProvInstance.address);
    await distributedTownInstance.deployed();
  }

  const deployGenesisCommunities = async () => {
    await distributedTownInstance.deployGenesisCommunities(0);
    await distributedTownInstance.deployGenesisCommunities(1);
    await distributedTownInstance.deployGenesisCommunities(2);
  }

  const joinMember = async () => {

  }
  before(async function () {
    const [signer] = await ethers.getSigners();
    memberAddress = signer.address;

    // Deploy instances
    console.log('deploying distributed town contract');
    await deployDistrbutedTown();
    console.log('deploying genesis communities');
    await deployGenesisCommunities();
    console.log('genesis communities deployed.')

    const communityAddresses = await distributedTownInstance.getCommunities();
    console.log('communityAddresses', communityAddresses);
    const CommunityFactory = await ethers.getContractFactory("Community");
    communityInstance = await CommunityFactory.attach(communityAddresses[0]);

    const memberTx = await communityInstance.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', 2006);
    const txReceipt = await memberTx.wait();

    const memberAddedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
    memberAddress = memberAddedEvent.args[0];
    memberTokenId = memberAddedEvent.args[1];

    await skillWalletInstance.activateSkillWallet(memberTokenId, '');
    const gigsAddr = await communityInstance.gigsAddr();
    console.log('gigsAddr', gigsAddr);
    const Gigs = await ethers.getContractFactory('Gigs',
    {
      libraries: {
        GigStatuses: gigStatusesInstance.address
      }
    });

    gigsInstance = await Gigs.attach(gigsAddr)

  })
  describe("Gigs", function () {

    describe("createGig()", async function () {
      it("Should fail when the gig creator isn't a community member", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = gigsInstance.createGig(
          '0x093ECac1110EF08976A0A1F24393c3e48936489D',
          200,
          metadataUrl
        );
        await expect(
          tx
        ).to.be.revertedWith("The creator of the gig should be a member of the community.");

      });
      it("Should fail when the dito credits are invalid amount", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx =  gigsInstance.createGig(
          memberAddress,
          2,
          metadataUrl
        );

        const tx1 = gigsInstance.createGig(
          memberAddress,
          1000,
          metadataUrl
        );
        await expect(
          tx
        ).to.be.revertedWith("Invalid credits amount.");
        await expect(
          tx1
        ).to.be.revertedWith("Invalid credits amount.");
      });

      it("Should fail if the creator doesn't have enough credits", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
        const t1 = await gigsInstance.createGig(
          memberAddress,
          720,
          metadataUrl
        );        
        const res1 = await t1.wait();

        const gigCreatedEvent1 = res1.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        expect(gigCreatedEvent1).to.not.be.undefined;

        const t2 = await gigsInstance.createGig(
          memberAddress,
          720,
          metadataUrl
        );
        const res2 = await t2.wait();
        const gigCreatedEvent2 = res2.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        expect(gigCreatedEvent2).to.not.be.undefined;

        const creatorBalance = await communityInstance.balanceOf(memberAddress);
        expect(creatorBalance.toString()).to.eq('566');

        const tx = gigsInstance.createGig(
          memberAddress,
          600,
          metadataUrl
        );


        // await expect(
        //   tx
        // ).to.be.revertedWith("The creator of the gig should be a member of the community.");
      });

      it.only("Should work correctly otherwise", async function () {
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
        const gigtCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'GigCreated');
        console.log(txReceipt.events);
        const creator = gigtCreatedEvent.args[0];
        const gigId = gigtCreatedEvent.args[1];
        const balanceAfter = await communityInstance.balanceOf(memberAddress);

        expect(+balanceBefore - +creditsAmount).to.eq(+balanceAfter);
        expect(gigId.toString()).to.be('0');
        expect(creator.toString()).to.eq(memberAddress);
      });
    })
  });
});
