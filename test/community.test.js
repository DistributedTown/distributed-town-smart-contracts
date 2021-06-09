const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { ZERO_ADDRESS } = constants;
const truffleAssert = require('truffle-assertions');

const GigStatuses = artifacts.require('GigStatuses');
const DistributedTown = artifacts.require('DistributedTown');
const Community = artifacts.require('Community');
const SkillWallet = artifacts.require('SkillWallet');
const Gigs = artifacts.require('Gigs');
const AddressProvider = artifacts.require('AddressProvider');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('Community', function (accounts) {

    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(accounts[1]);
        this.gigStatuses = await GigStatuses.new();
        AddressProvider.link(this.gigStatuses);
        this.addressProvder = await AddressProvider.new();

        this.skillWallet = await SkillWallet.new('0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876', { from: accounts[2] });
        this.distirbutedTown = await DistributedTown.new('http://someurl.co', this.skillWallet.address, this.addressProvder.address, { from: accounts[2] });
        await this.distirbutedTown.deployGenesisCommunities(0, { from: accounts[2] });
        await this.distirbutedTown.deployGenesisCommunities(1, { from: accounts[2] });
        const communities = await this.distirbutedTown.getCommunities();
        this.community = await Community.at(communities[0]);
        this.community2 = await Community.at(communities[1]);

        const gigsAddr = await this.community.gigsAddr();
        this.gigs = await Gigs.at(gigsAddr);
        const tx = await this.community.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(2006)), { from: accounts[3] });
        memberAddress = accounts[3];
    });
    describe('Join new member', async function () {

        it("should fail if the user is already a part of the community", async function () {

            const tx = this.community.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(2006)), { from: memberAddress });

            await truffleAssert.reverts(
                tx,
                "Already a member"
            );
        });
        it("should fail if the user is a member of another community", async function () {
            const tx = this.community2.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(2006)), { from: memberAddress });
            await truffleAssert.reverts(
                tx,
                "There is SkillWallet already registered for this address."
            );
        });
        it("should transfer credits correctly", async function () {

            const userAddress = accounts[6];
            const creditsHolderBalanceBefore = await this.community.balanceOf(await this.community.erc777Recipient());
            const tx = await this.community.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(3000)), { from: accounts[6] });
            const memberAddedEvent = tx.logs[0].event === 'MemberAdded'
            assert.equal(memberAddedEvent, true);

            const memberBalance = await this.community.balanceOf(userAddress);
            assert.equal(memberBalance.toString(), web3.utils.toWei(new BN(3000)).toString());

            const creditsHolderBalanceAfter = await this.community.balanceOf(await this.community.erc777Recipient());
            assert.equal((+web3.utils.fromWei(creditsHolderBalanceBefore.toString()) - 3000), +web3.utils.fromWei(creditsHolderBalanceAfter.toString()));
            
            const tokenId = tx.logs[0].args[1];
            const membersCount = await this.community.activeMembersCount()
            const isMember = await this.community.isMember(userAddress)
            const skillWalletIds = await this.community.getMembers();
      
            const skillWalletRegistered = await this.skillWallet.isSkillWalletRegistered(userAddress);
            const skillWalletId = await this.skillWallet.getSkillWalletIdByOwner(userAddress);
            const skillWalletActiveCommunity = await this.skillWallet.getActiveCommunity(tokenId);
            const skillWalletCommunityHistory = await this.skillWallet.getCommunityHistory(tokenId);
            const skillWalletSkillSet = await this.skillWallet.getSkillSet(tokenId);
            const skillWalletActivated = await this.skillWallet.isSkillWalletActivated(tokenId);

            assert.equal(skillWalletRegistered, true);
            assert.equal(skillWalletId.toString(), tokenId.toString());
            assert.equal(skillWalletActiveCommunity, this.community.address);
            assert.equal(skillWalletActivated, false);
            assert.equal(skillWalletSkillSet['skill2']['displayStringId'].toString(), '2');
            assert.equal(skillWalletSkillSet['skill2']['level'].toString(), '2');
            assert.equal(skillWalletCommunityHistory[0], this.community.address);
            assert.equal(membersCount.toString(), '3');
            assert.equal(isMember, true);
            expect(skillWalletIds[2].toString()).to.eq(tokenId.toString());
        });
    });
});
