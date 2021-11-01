const { singletons } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { upgrades, ethers } = require('hardhat');
const truffleAssert = require('truffle-assertions')

const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

let erc1820;
let skillWallet;
let distributedTown;

contract('DistributedTown', function (
    
) {
    beforeEach(async function () {

        [deployer, ...accounts] = await ethers.getSigners();
        const GigStatuses = await ethers.getContractFactory("GigStatuses");
        const DistributedTown = await ethers.getContractFactory("DistributedTown");
        const SkillWallet = await ethers.getContractFactory('SkillWallet');
        const CommunityFactory = await ethers.getContractFactory('CommunityFactory');

        erc1820 = await singletons.ERC1820Registry(deployer.address);
        const gigStatuses = await GigStatuses.deploy();
        await gigStatuses.deployed();

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
    });

    describe('Deploy Genesis Communities', async function () {
        it("create genesis community", async function () {
            const tx0 = await (await distributedTown.connect(deployer).deployGenesisCommunities(0)).wait();
            const comCreated0 = tx0.events.find(e => e.event == 'CommunityCreated');

            const tx1 = await (await distributedTown.connect(deployer).deployGenesisCommunities(1)).wait();
            const comCreated1 = tx1.events.find(e => e.event == 'CommunityCreated');

            const tx2 = await (await distributedTown.connect(deployer).deployGenesisCommunities(2)).wait();
            const comCreated2 = tx2.events.find(e => e.event == 'CommunityCreated');

            assert.isNotNull(comCreated0)
            assert.isNotNull(comCreated1)
            assert.isNotNull(comCreated2)
        });

        it("should fail deploying genesis communities if doesn't called by deployer", async function () {
            const failingTx = distributedTown.connect(accounts[2]).deployGenesisCommunities(0);
            await truffleAssert.reverts(
                failingTx,
                'Ownable: caller is not the owner',
              )
        });


        it("should fail deploying genesis community with invalid template", async function () {
            const failingTx = distributedTown.connect(deployer).deployGenesisCommunities(5);
            await truffleAssert.reverts(
                failingTx,
                'Invalid templateID',
              )
        });


        it("should fail deploying 4th genesis community", async function () {
           
            const tx0 = await (await distributedTown.connect(deployer).deployGenesisCommunities(0)).wait();
            const comCreated0 = tx0.events.find(e => e.event == 'CommunityCreated');

            const tx1 = await (await distributedTown.connect(deployer).deployGenesisCommunities(1)).wait();
            const comCreated1 = tx1.events.find(e => e.event == 'CommunityCreated');

            const tx2 = await (await distributedTown.connect(deployer).deployGenesisCommunities(2)).wait();
            const comCreated2 = tx2.events.find(e => e.event == 'CommunityCreated');

            assert.isNotNull(comCreated0)
            assert.isNotNull(comCreated1)
            assert.isNotNull(comCreated2)

            const failingTx = distributedTown.connect(deployer).deployGenesisCommunities(0);
            await truffleAssert.reverts(
                failingTx,
                'Only the first 3 communities can be deployed as Genesis ones',
              )
        });
    });
});
