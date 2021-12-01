const { singletons, constants } = require('@openzeppelin/test-helpers')
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')
const { upgrades, ethers } = require('hardhat')

const MockOracle = artifacts.require('skill-wallet/contracts/mocks/MockOracle')
const LinkToken = artifacts.require('skill-wallet/contracts/mocks/LinkToken')
const SkillWallet = artifacts.require('skill-wallet/contracts/main/SkillWallet')
const OSM = artifacts.require('skill-wallet/contracts/main/OffchainSignatureMechanism')

const GigStatuses = artifacts.require('GigStatuses')
//const DistributedTown = artifacts.require('DistributedTown')
const Community = artifacts.require('Community')
const AddressProvider = artifacts.require('AddressProvider')
const Projects = artifacts.require('Projects')
const CommunityFactory = artifacts.require('CommunityFactory');
const metadataUrl =
  'https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice'
var BN = web3.utils.BN
let tokenId = 0

contract('Projects', function ([_, registryFunder, creator, member]) {
  // before(async function () {
  //   this.erc1820 = await singletons.ERC1820Registry(registryFunder)
  //   this.gigStatuses = await GigStatuses.new()
  //   AddressProvider.link(this.gigStatuses)
  //   this.addressProvder = await AddressProvider.new()
  //   this.communityFactory = await CommunityFactory.new(1);

  //   // SkillWallet
  //   this.linkTokenMock = await LinkToken.new()
  //   this.mockOracle = await MockOracle.new(this.linkTokenMock.address)
  //   this.skillWallet = await SkillWallet.new(
  //     this.linkTokenMock.address,
  //     this.mockOracle.address,
  //     { from: creator },
  //   )

  //   this.osm = await OSM.at(await this.skillWallet.getOSMAddress());
    
  //   const DistributedTown = await ethers.getContractFactory("DistributedTown", creator);
  //   this.distirbutedTown = await upgrades.deployProxy(
  //     DistributedTown,
  //     [
  //       'http://someurl.co',
  //       this.skillWallet.address,
  //       this.addressProvder.address,
  //       this.communityFactory.address
  //     ]
  //   );
    
  //   await this.distirbutedTown.deployGenesisCommunities(0)
  //   await this.distirbutedTown.deployGenesisCommunities(1)
  //   const communities = await this.distirbutedTown.getCommunities()
  //   this.community = await Community.at(communities[0])
  //   this.community1 = await Community.at(communities[1])
  //   const gigsAddr = await this.community.gigsAddr()
  //   this.projects = await Projects.new(this.skillWallet.address)
  //   const tx = await this.community.joinNewMember(
  //     'http://someuri.co',
  //     1,
  //     web3.utils.toWei(new BN(2006)),
  //     { from: member },
  //   )
  //   tokenId = tx.logs[0].args[1]
  //   await this.skillWallet.claim({from: member})
  //   await this.skillWallet.addPubKeyToSkillWallet(tokenId, 'pubKey', {
  //     from: creator,
  //   })
  //   memberAddress = member
  // })
  describe.skip('Creating a project', async function () {
    it("should fail when the creator doesn't have a skill wallet", async function () {
      const tx = this.projects.createProject(
        metadataUrl,
        this.community.address,
        '0x093ECac1110EF08976A0A1F24393c3e48936489D',
      )

      await truffleAssert.reverts(
        tx,
        'Only a registered skill wallet can create a project.',
      )
    })
    it('should fail when the creators skill wallet is not activated', async function () {
      const tx = this.projects.createProject(
        metadataUrl,
        this.community.address,
        memberAddress,
      )

      await truffleAssert.reverts(
        tx,
        'Only an active skill wallet can create a project.',
      )
    })
    it("should fail when the creator isn't a part of the community", async function () {
      const skillWalletId = await this.skillWallet.getSkillWalletIdByOwner(
        memberAddress,
      )
      const skillWalletActivated = await this.skillWallet.isSkillWalletActivated(
        skillWalletId,
      )

      if (!skillWalletActivated) {
        await this.linkTokenMock.transfer(
          this.osm.address,
          '2000000000000000000',
        )
        const validationTx = await this.skillWallet.validate(
          'signature',
          tokenId,
          0,
          [],
          [],
          [],
        )
        const validationRequestIdSentEventEmitted =
          validationTx.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted)
        const requestId = validationTx.logs[0].args[0]

        const fulfilTx = await this.mockOracle.fulfillOracleRequest(
          requestId,
          true,
        )
        const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

        assert.isTrue(fulfilTxEventEmitted)
        const isSWActivated = await this.skillWallet.isSkillWalletActivated(
          tokenId,
        )
        assert.isTrue(isSWActivated)
      }
      const tx = this.projects.createProject(
        metadataUrl,
        this.community1.address,
        memberAddress,
      )

      await truffleAssert.reverts(
        tx,
        'Only a member of the community can create a project.',
      )
    })
    it('should create a project', async function () {
      const skillWalletId = await this.skillWallet.getSkillWalletIdByOwner(
        memberAddress,
      )
      const skillWalletActivated = await this.skillWallet.isSkillWalletActivated(
        skillWalletId,
      )
      if (!skillWalletActivated) {
        await this.linkTokenMock.transfer(
          this.osm.address,
          '2000000000000000000',
        )
        const validationTx = await this.osm.validate(
          'signature',
          tokenId,
          0,
          [],
          [],
          [],
        )
        const validationRequestIdSentEventEmitted =
          validationTx.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted)
        const requestId = validationTx.logs[0].args[0]

        const fulfilTx = await this.mockOracle.fulfillOracleRequest(
          requestId,
          true,
        )
        const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

        assert.isTrue(fulfilTxEventEmitted)
        const isSWActivated = await this.skillWallet.isSkillWalletActivated(
          tokenId,
        )
        assert.isTrue(isSWActivated)
      }

      const tx = await this.projects.createProject(
        metadataUrl,
        this.community.address,
        memberAddress,
      )
      const projectCreatedEvent = tx.logs[1].event === 'ProjectCreated'

      assert.equal(projectCreatedEvent, true)
    })
  })
})
