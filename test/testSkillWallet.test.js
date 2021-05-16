const { ethers } = require("hardhat");
const { use, expect } = require("chai");
const { solidity } = require("ethereum-waffle");


use(solidity);

describe("SkillWallet tests tests", function () {

    const amount = (n) => {
        return ethers.utils.parseEther(n)
    }

    let distributedTownInstance;
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
        const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");

        const SkillWalletFactory = await ethers.getContractFactory("SkillWallet");
        const GigsFactory = await ethers.getContractFactory("Gigs");
        const CommunityFactory = await ethers.getContractFactory("Community");
        const jobId = ethers.utils.toUtf8Bytes('246a1e4d23694d858d7d5ed1088e2199')

        skillWalletInstance = await SkillWalletFactory.deploy(account1.address, jobId);
        await skillWalletInstance.deployed();

        provider = skillWalletInstance.provider;

        let blockNumber = await provider.getBlockNumber();
        console.log("Current block number", blockNumber);

        distributedTownInstance = await DistributedTownFactory.deploy('', skillWalletInstance.address);
        await distributedTownInstance.deployed();
        const a = await distributedTownInstance.deployGenesisCommunity(0);
        console.log(await a.wait());
        
        const communities = await distributedTownInstance.getCommunities();
        gigsInstance = await GigsFactory.deploy();
        await gigsInstance.deployed();

        communityInstance = await CommunityFactory.attach(communities[0]);

    })


    describe("SkillWallet", function() {

        it("should be deployed correctly", async function () {
            const name = await skillWalletInstance.name();
            const symbol = await skillWalletInstance.symbol();
            const totalWalletsRegistered = await skillWalletInstance.getTotalSkillWalletsRegistered();

            expect (name).to.be.equal(skillWalletContractName);
            expect (symbol).to.be.equal(skillWalletContractSymbol);
            expect (totalWalletsRegistered).to.be.equal(ethers.BigNumber.from(1));
        });

        it("should work properly", async function () {

            // join community as new member
            let userAddress = ethers.utils.getAddress(account0.address);
            let credits = ethers.utils.parseEther("2006");
            let oneBn = ethers.BigNumber.from(1);
            let communityAddress = communityInstance.address
            await communityInstance.joinNewMember(userAddress, oneBn, oneBn, oneBn, oneBn, oneBn, oneBn, '', credits)

            const skillWalletRegistered = await skillWalletInstance.isSkillWalletRegistered(userAddress);
            const skillWalletId = await skillWalletInstance.getSkillWalletIdByOwner(userAddress);
            const skillWalletActiveCommunity = await skillWalletInstance.getActiveCommunity(1);
            const skillWalletCommunityHistory = await skillWalletInstance.getCommunityHistory(1);
            const skillWalletSkillSet = await skillWalletInstance.getSkillSet(1);
            const skillWalletActivated = await skillWalletInstance.isSkillWalletActivated(1);

            expect (skillWalletRegistered).to.be.equal(true);
            expect (skillWalletId).to.be.equal(ethers.BigNumber.from(1));
            expect (skillWalletActiveCommunity).to.be.equal(communityAddress);
            expect (skillWalletActivated).to.be.equal(false);
            expect (skillWalletSkillSet['skill1']['displayStringId']).to.be.equal(oneBn);
            expect (skillWalletSkillSet['skill1']['level']).to.be.equal(oneBn);
            expect (skillWalletCommunityHistory[0]).to.be.equal(communityAddress);

        });
    })
});