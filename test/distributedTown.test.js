const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { ZERO_ADDRESS } = constants;
const truffleAssert = require('truffle-assertions');

const GigStatuses = artifacts.require('GigStatuses');
const DistributedTown = artifacts.require('DistributedTown');
const Community = artifacts.require('Community');
const SkillWallet = artifacts.require('skill-wallet/contracts/main/SkillWallet');
const Gigs = artifacts.require('Gigs');
const AddressProvider = artifacts.require('AddressProvider');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('DistributedTown', function (accounts) {

    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(accounts[1]);
        this.gigStatuses = await GigStatuses.new();
        AddressProvider.link(this.gigStatuses);
        this.addressProvder = await AddressProvider.new();

        this.skillWallet = await SkillWallet.new('0x64307b67314b584b1E3Be606255bd683C835A876', '0x64307b67314b584b1E3Be606255bd683C835A876', { from: accounts[2] });
        this.distirbutedTown = await DistributedTown.new('http://someurl.co', this.skillWallet.address, this.addressProvder.address, { from: accounts[2] });
    });
    describe('Deploy Genesis Communities', async function () {
        it("create genesis community", async function () {
            const tx = await this.distirbutedTown.deployGenesisCommunities(0, { from: accounts[2] });
            const comCreated = tx.logs[3].event === 'CommunityCreated';
            assert.isTrue(comCreated);
        });
    });
});
