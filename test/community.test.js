const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { upgrades, ethers } = require('hardhat');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');

var BN = web3.utils.BN;

let erc1820;
let skillWallet;
let distributedTown;
let community;
let community2;
let gigs;
let ditoCreditCommunityHolder;
let communityRoles3;
let communityRoles2
let addressProvder;

contract('Community', function (accounts) {

    before(async function () {
        [deployer, ...accounts] = await ethers.getSigners();
        const GigStatuses = await ethers.getContractFactory("GigStatuses");
        const DistributedTown = await ethers.getContractFactory("DistributedTown");
        const SkillWallet = await ethers.getContractFactory('SkillWallet');
        const Community = await ethers.getContractFactory('Community');
        const CommunityFactory = await ethers.getContractFactory('CommunityFactory');

        erc1820 = await singletons.ERC1820Registry(deployer.address);
        const gigStatuses = await GigStatuses.deploy();
        await gigStatuses.deployed();

        const Gigs = await ethers.getContractFactory('Gigs', {
            libraries: {
                GigStatuses: gigStatuses.address
            }
        });
        const AddressProvider = await ethers.getContractFactory('AddressProvider', {
            libraries: {
                GigStatuses: gigStatuses.address
            }
        });

        addressProvder = await AddressProvider.deploy();
        const communityFactory = await CommunityFactory.deploy([1]);
        await addressProvder.deployed();


        skillWallet = await upgrades.deployProxy(
            SkillWallet,
            ['0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876'],
        );

        await skillWallet.deployed();

        distributedTown = await upgrades.deployProxy(
            DistributedTown,
            ['http://someurl.co', skillWallet.address, addressProvder.address, communityFactory.address],
        );

        await distributedTown.deployed();

        const tx0 = await (await distributedTown.connect(deployer).deployGenesisCommunities(0)).wait();
        const tx1 = await (await distributedTown.connect(deployer).deployGenesisCommunities(1)).wait();
        const communities = await distributedTown.getCommunities();

        community = await Community.attach(communities[0]);
        community2 = await Community.attach(communities[1]);
        ditoCreditCommunityHolder = await community.ditoCreditsHolder();
        const gigsAddr = await community.gigsAddr();
        gigs = await Gigs.attach(gigsAddr);
        memberAddress = accounts[3];
        await (await community
            .connect(memberAddress)
            .joinNewMember(
                'http://someuri.co',
                1,
                web3.utils.toWei(new BN(2006)).toString())
        ).wait();

    });
    describe('Join new member', async function () {

        it("should fail if the user is a member a member of a community", async function () {
            let tx = community2.connect(memberAddress).joinNewMember('http://someuri.co',1, web3.utils.toWei(new BN(2006)).toString());
            await truffleAssert.reverts(
                tx,
                "SkillWallet: There is SkillWallet to be claimed by this address."
            );

            // claim

            await (
                await skillWallet.connect(memberAddress).claim()
            ).wait()

            tx = community2.connect(memberAddress).joinNewMember('http://someuri.co',1, web3.utils.toWei(new BN(2006)).toString());
            await truffleAssert.reverts(
                tx,
                "SkillWallet: There is SkillWallet already registered for this address."
            );


            tx = community.connect(memberAddress).joinNewMember('http://someuri.co',1, web3.utils.toWei(new BN(2006)).toString());

            await truffleAssert.reverts(
                tx,
                "Already a member"
            );

        });
        it("should transfer credits correctly", async function () {
            const userAccount = accounts[6];
            const userAddress = userAccount.address;

            const creditsHolderBalanceBefore = await community.balanceOf(ditoCreditCommunityHolder);
            const tx = await (await community
                .connect(userAccount)
                .joinNewMember(
                    'http://someuri.co',
                    1,
                    web3.utils.toWei(new BN(3000).toString())
                ))
                .wait();
            const memberAddedEvent = tx.events.find(e => e.event == 'MemberAdded');

            assert.isNotNull(memberAddedEvent)

            await (
                await skillWallet.connect(userAccount).claim()
            ).wait()

            const memberBalance = await community.balanceOf(userAddress);
            assert.equal(
                memberBalance.toString(),
                web3.utils.toWei(new BN(3000)).toString());

            const creditsHolderBalanceAfter = await community.balanceOf(ditoCreditCommunityHolder);
            assert.equal((+web3.utils.fromWei(creditsHolderBalanceBefore.toString()) - 3000), +web3.utils.fromWei(creditsHolderBalanceAfter.toString()));

            const tokenId = memberAddedEvent.args._skillWalletTokenId;
            const membersCount = await community.activeMembersCount()
            const isMember = await community.isMember(userAddress)
            const skillWalletIds = await community.getMembers();

            const skillWalletRegistered = await skillWallet.isSkillWalletRegistered(userAddress);
            const skillWalletId = await skillWallet.getSkillWalletIdByOwner(userAddress);
            const skillWalletActiveCommunity = await skillWallet.getActiveCommunity(tokenId);
            const skillWalletCommunityHistory = await skillWallet.getCommunityHistory(tokenId);
            const skillWalletActivated = await skillWallet.isSkillWalletActivated(tokenId);

            assert.equal(skillWalletRegistered, true);
            assert.equal(skillWalletId.toString(), tokenId.toString());
            assert.equal(skillWalletActiveCommunity, community.address);
            assert.equal(skillWalletActivated, false);
            assert.equal(skillWalletCommunityHistory[0], community.address);
            assert.equal(membersCount.toString(), '3');
            assert.equal(isMember, true);
            expect(skillWalletIds[2].toString()).to.eq(tokenId.toString());
        });
        it("Should create community with 10 members and 3 roles and calclulate role limits", async () => {
            const Community = await ethers.getContractFactory('Community');

            communityRoles3 = await Community.deploy(
                distributedTown.address,
                true,
                "",
                addressProvder.address,
                10,
                3,
                false,
                ZERO_ADDRESS,
                1
            );

            expect(await communityRoles3.roleMembershipsLeft(1)).to.equal("5"); //1 less since dito is the first member
            expect(await communityRoles3.roleMembershipsLeft(2)).to.equal("3");
            expect(await communityRoles3.roleMembershipsLeft(3)).to.equal("1");
        });
        it("Should create community with 20 members and 2 roles", async () => {
            const Community = await ethers.getContractFactory('Community');

            communityRoles2 = await Community.deploy(
                distributedTown.address,
                true,
                "",
                addressProvder.address,
                20,
                2,
                false,
                ZERO_ADDRESS,
                1
            );

            expect(await communityRoles2.roleMembershipsLeft(1)).to.equal("11"); //1 less since dito is the first member
            expect(await communityRoles2.roleMembershipsLeft(2)).to.equal("8");
            expect(await communityRoles2.roleMembershipsLeft(3)).to.equal("0");
        });
        it("Should add a member with role 3 to community with 3 roles", async () => {
            await communityRoles3.connect(accounts[1]).joinNewMember('http://someuri.co',3,0);

            expect(await communityRoles3.roleMembershipsLeft(3)).to.equal("0");
        });
        it("Should not allow new members with role 3 (as only 1 is allowed)", async () => {
            await expect(communityRoles3.connect(accounts[2]).joinNewMember('http://someuri.co',3,0)).to.be.revertedWith("All role positions are taken");
        });
        it("Should add 5 member with role 1 to community with 3 roles", async () => {
            await communityRoles3.connect(accounts[13]).joinNewMember('http://someuri.co',1,0);
            await communityRoles3.connect(accounts[4]).joinNewMember('http://someuri.co',1,0);
            await communityRoles3.connect(accounts[5]).joinNewMember('http://someuri.co',1,0);
            await communityRoles3.connect(accounts[14]).joinNewMember('http://someuri.co',1,0);
            await communityRoles3.connect(accounts[7]).joinNewMember('http://someuri.co',1,0);

            expect(await communityRoles3.roleMembershipsLeft(1)).to.equal("0");
        });
        it("Should not allow new members with role 1 (as limit is reached)", async () => {
            await expect(communityRoles3.connect(accounts[8]).joinNewMember('http://someuri.co',1,0)).to.be.revertedWith("All role positions are taken");
        });
        it("Should add 5 member with role 2 to community with 3 roles", async () => {
            await communityRoles3.connect(accounts[9]).joinNewMember('http://someuri.co',2,0);
            await communityRoles3.connect(accounts[10]).joinNewMember('http://someuri.co',2,0);
            await communityRoles3.connect(accounts[11]).joinNewMember('http://someuri.co',2,0);


            expect(await communityRoles3.roleMembershipsLeft(2)).to.equal("0");
        });
        it("Should not allow new members with role 1 (as limit is reached)", async () => {
            await expect(communityRoles3.connect(accounts[12]).joinNewMember('http://someuri.co',2,0)).to.be.revertedWith("All role positions are taken");
        });
    });    
});
