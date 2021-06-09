const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { ZERO_ADDRESS } = constants;
const truffleAssert = require('truffle-assertions');

const GigStatuses = artifacts.require('GigStatuses');
const DistributedTown = artifacts.require('DistributedTown');
const Community = artifacts.require('Community');
const SkillWallet = artifacts.require('SkillWallet');
const AddressProvider = artifacts.require('AddressProvider');
const Projects = artifacts.require('Projects');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('Projects', function ([_, registryFunder, creator, member]) {

    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(registryFunder);
        this.gigStatuses = await GigStatuses.new();
        AddressProvider.link(this.gigStatuses);
        this.addressProvder = await AddressProvider.new();

        this.skillWallet = await SkillWallet.new('0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876', { from: creator });
        this.distirbutedTown = await DistributedTown.new('http://someurl.co', this.skillWallet.address, this.addressProvder.address, { from: creator });
        await this.distirbutedTown.deployGenesisCommunities(0, { from: creator });
        await this.distirbutedTown.deployGenesisCommunities(1, { from: creator });
        const communities = await this.distirbutedTown.getCommunities();
        this.community = await Community.at(communities[0]);
        this.community1 = await Community.at(communities[1]);
        const gigsAddr = await this.community.gigsAddr();
        this.projects = await Projects.new(this.skillWallet.address);
        const tx = await this.community.joinNewMember(1, 1, 2, 2, 3, 3, 'http://someuri.co', web3.utils.toWei(new BN(2006)), { from: member });
        memberAddress = member;
    });
    describe('Creating a project', async function () {

        it("should fail when the creator doesn't have a skill wallet", async function () {

            const tx = this.projects.createProject(
                metadataUrl,
                this.community.address,
                '0x093ECac1110EF08976A0A1F24393c3e48936489D',
            );

            await truffleAssert.reverts(
                tx,
                "Only a registered skill wallet can create a project."
            );
        });
        it("should fail when the creators skill wallet is not activated", async function () {

            const tx = this.projects.createProject(
                metadataUrl,
                this.community.address,
                memberAddress,
            );

            await truffleAssert.reverts(
                tx,
                "Only an active skill wallet can create a project."
            );
        });
        it("should fail when the creator isn't a part of the community", async function () {
            const skillWalletId = await this.skillWallet.getSkillWalletIdByOwner(memberAddress);
            const skillWalletActivated = await this.skillWallet.isSkillWalletActivated(skillWalletId);
            
            if(!skillWalletActivated) {
                const activateTx = await this.skillWallet.activateSkillWallet(skillWalletId, '', {from: creator});
                const skillWalletActivatedEvent = activateTx.logs[0].event === 'SkillWalletActivated'
                assert.equal(skillWalletActivatedEvent, true);
            }

            const tx = this.projects.createProject(
                metadataUrl,
                this.community1.address,
                memberAddress,
            );

            await truffleAssert.reverts(
                tx,
                "Only a member of the community can create a project."
            );
        });
        it('should create a project', async function () {
            const skillWalletId = await this.skillWallet.getSkillWalletIdByOwner(memberAddress);
            const skillWalletActivated = await this.skillWallet.isSkillWalletActivated(skillWalletId);
            if(!skillWalletActivated) {
                const activateTx = await this.skillWallet.activateSkillWallet(skillWalletId, '', {from: creator});
                const skillWalletActivatedEvent = activateTx.logs[1].event === 'SkillWalletActivated'
                assert.equal(skillWalletActivatedEvent, true);
            }
           
            const tx = await this.projects.createProject(
                metadataUrl,
                this.community.address,
                memberAddress,
            );
            const projectCreatedEvent = tx.logs[1].event === 'ProjectCreated'

            assert.equal(projectCreatedEvent, true);

        });
    });
});
