const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');
const { upgrades, ethers } = require('hardhat');

var BN = web3.utils.BN;

let erc1820;
let skillWallet;
let distributedTown;
let community;
let community2;
let gigs;
let ditoCreditCommunityHolder;

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

        const addressProvder = await AddressProvider.deploy();
        const communityFactory = await CommunityFactory.deploy([1]);
        await addressProvder.deployed();

        skillWallet = await SkillWallet.deploy('0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876');
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
        const a = await (await community
            .connect(memberAddress)
            .joinNewMember(
                'http://someuri.co',
                web3.utils.toWei(new BN(2006)).toString())
        ).wait();
        console.log(a);
        const balance = await skillWallet.balanceOf(memberAddress.address);
        console.log('balance', balance.toString());
        console.log(a.events[5].args._skillWalletTokenId);
        const activeCom = await skillWallet.getActiveCommunity(a.events[5].args._skillWalletTokenId);
        console.log('activeCom', activeCom);

    });
    describe('Join new member', async function () {

        it("should fail if the user is a member a member of a community", async function () {
            let tx = community2.connect(memberAddress).joinNewMember('http://someuri.co', web3.utils.toWei(new BN(2006)).toString());
            await truffleAssert.reverts(
                tx,
                "SkillWallet: There is SkillWallet to be claimed by this address."
            );

            // claim

            await (
                await skillWallet.connect(memberAddress).claim()
            ).wait()

            tx = community2.connect(memberAddress).joinNewMember('http://someuri.co', web3.utils.toWei(new BN(2006)).toString());
            await truffleAssert.reverts(
                tx,
                "SkillWallet: There is SkillWallet already registered for this address."
            );


            tx = community.connect(memberAddress).joinNewMember('http://someuri.co', web3.utils.toWei(new BN(2006)).toString());

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
    });
});
