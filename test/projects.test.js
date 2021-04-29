const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Projects", function () {

  let skillWalletInstance;
  let provider;
  let accounts;

  before(async function () {
    accounts = await ethers.getSigners();
    account0 = accounts[0];
    account1 = accounts[1];

    // Deploy instances
    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const ProjectFactory = await ethers.getContractFactory("Project");
    const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");

    skillWalletInstance = await SkillWalletFactory.deploy();
    await skillWalletInstance.deployed();

    provider = skillWalletInstance.provider;

    let blockNumber = await provider.getBlockNumber();
    console.log("Current block number", blockNumber);

    distributedTownInstance = await DistributedTownFactory.deploy('http://someurl.co', skillWalletInstance.address);
    await distributedTownInstance.deployed();

    projectsInstance = await ProjectFactory.deploy();
    await projectsInstance.deployed();

  })
  describe("Projects", function () {

    describe("createProject()", async function () {
      it("Should create a project", async function () {
          const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";

        const tx = await projectsInstance.createProject(
            metadataUrl,
          0
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
    })
  });
});
