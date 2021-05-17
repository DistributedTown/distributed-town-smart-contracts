const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe.only("Projects", function () {

  let skillWalletInstance;
  let provider;
  let communityInstance;
  let memberAddress;
  let memberTokenId;

  before(async function () {
    const [signer] = await ethers.getSigners();
    memberAddress = signer.address;
    // Deploy instances
    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const ProjectFactory = await ethers.getContractFactory("Projects");
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
    
    const memberTx = await communityInstance.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', 2006);
    const txReceipt = await memberTx.wait();

    const memberAddedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'MemberAdded');
    memberTokenId = memberAddedEvent.args[1];

    await skillWalletInstance.activateSkillWallet(memberTokenId, '');

    const projectAddress = await distributedTownInstance.projectsAddress();
    projectsInstance = await ProjectFactory.attach(projectAddress)
    await projectsInstance.deployed();

  })
  describe("Projects", function () {

    describe("createProject()", async function () {
      it("Should fail when the user doesn't have a skill wallet", async function () {
        const communities = await distributedTownInstance.getCommunities();
        console.log(communities);
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await projectsInstance.createProject(
          metadataUrl,
          communities[0],
          '0x093ECac1110EF08976A0A1F24393c3e48936489D'
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'ProjectCreated');
        const address = projectCreatedEvent.args[0];
        const tokenId = projectCreatedEvent.args[1];
        const template = projectCreatedEvent.args[2];

        const uri = await projectsInstance.uri(tokenId);
        const owner = await projectsInstance.ownerOf(tokenId);

        expect(uri).to.eq(metadataUrl);
      });

      it("Should work when the user has an active skill wallet", async function () {
        const communities = await distributedTownInstance.getCommunities();
        const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await projectsInstance.createProject(
          metadataUrl,
          communities[0],
          memberAddress
        );
        const txReceipt = await tx.wait();
        const projectCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'ProjectCreated');
        const address = projectCreatedEvent.args[0];
        const tokenId = projectCreatedEvent.args[1];
        const template = projectCreatedEvent.args[2];

        const uri = await projectsInstance.tokenURI(tokenId);
        const owner = await projectsInstance.ownerOf(tokenId);

        expect(uri).to.eq(metadataUrl);
        expect(owner).to.eq(memberAddress);
      });
    })
  });
});
