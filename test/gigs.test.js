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

contract('Gigs', function ([_, registryFunder, creator, member]) {

    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
        this.gigStatuses = await GigStatuses.new();
        AddressProvider.link(this.gigStatuses);
        this.addressProvder = await AddressProvider.new();

        this.skillWallet = await SkillWallet.new('0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876', { from: creator });
        this.distirbutedTown = await DistributedTown.new('http://someurl.co', this.skillWallet.address, this.addressProvder.address, { from: creator });
        await this.distirbutedTown.deployGenesisCommunities(0, { from: creator });
        const communities = await this.distirbutedTown.getCommunities();
        this.community = await Community.at(communities[0]);
        const gigsAddr = await this.community.gigsAddr();
        this.gigs = await Gigs.at(gigsAddr);
        const tx = await this.community.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(2006)), { from: member });
        memberAddress = member;
    });
    describe('Creating a gig', async function () {

        it("should fail when the gig creator isn't a community member", async function () {

            const tx = this.gigs.createGig(
                '0x093ECac1110EF08976A0A1F24393c3e48936489D',
                web3.utils.toWei(new BN(200)),
                metadataUrl
            );

            await truffleAssert.reverts(
                tx,
                "The creator of the gig should be a member of the community."
            );
        });
        it("should fail when the dito credits are invalid amount", async function () {

            const tx = this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(2)),
                metadataUrl
            );

            const tx1 = this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(1000)),
                metadataUrl
            );
            await truffleAssert.reverts(
                tx,
                "Invalid credits amount."
            );
            await truffleAssert.reverts(
                tx1,
                "Invalid credits amount."
            );
        });

        it("should fail when the creator doesn't have enough credits", async function () {
            const creditsHolderBalanceBefore = await this.community.balanceOf(await this.community.erc777Recipient());
            const tx1 = await this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(720)),
                metadataUrl
            );
            const gigCreatedEvent1 = tx1.logs[1].event === 'GigCreated'
            assert.equal(gigCreatedEvent1, true);

            const tx2 = await this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(720)),
                metadataUrl
            );

            const gigCreatedEvent2 = tx2.logs[1].event === 'GigCreated'
            assert.equal(gigCreatedEvent2, true);

            const creatorBalance = await this.community.balanceOf(memberAddress);
            assert.equal(creatorBalance.toString(), web3.utils.toWei(new BN(566)).toString());
            const creditsHolderBalanceAfter = await this.community.balanceOf(await this.community.erc777Recipient());

            assert.equal((+web3.utils.fromWei(creditsHolderBalanceBefore.toString()) + 1440), +web3.utils.fromWei(creditsHolderBalanceAfter.toString()));

            const tx = this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(600)),
                metadataUrl
            );

            await truffleAssert.reverts(
                tx,
                "Insufficient dito balance"
            );
        });
        it('should create a gig and transfer the credits correctly', async function () {
            const balanceBefore = await this.community.balanceOf(memberAddress);
            const balanceCreditsHolderBefore = await this.community.balanceOf(await this.community.erc777Recipient());

            const creditsAmount = 50;
            const tx = await this.gigs.createGig(
                memberAddress,
                web3.utils.toWei(new BN(creditsAmount)),
                metadataUrl
            );
            const gigtCreatedEvent = tx.logs[1].event === 'GigCreated'
            const creator = tx.logs[1].args[0];
            const balanceAfter = await this.community.balanceOf(memberAddress);
            const balanceCreditsHolderAfter = await this.community.balanceOf(await this.community.erc777Recipient());

            assert.equal(gigtCreatedEvent, true);
            assert.equal((+web3.utils.fromWei(balanceBefore.toString()) - creditsAmount), +web3.utils.fromWei(balanceAfter.toString()));
            assert.equal((+web3.utils.fromWei(balanceCreditsHolderBefore.toString()) + creditsAmount), +web3.utils.fromWei(balanceCreditsHolderAfter.toString()));
            assert.equal(creator.toString(), memberAddress);
        });
    });
});
