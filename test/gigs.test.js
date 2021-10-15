const { singletons } = require('@openzeppelin/test-helpers')
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')

const GigStatuses = artifacts.require('GigStatuses')
const DistributedTown = artifacts.require('DistributedTown')
const Community = artifacts.require('Community')
const CommunityFactory = artifacts.require('CommunityFactory');

const MockOracle = artifacts.require('skill-wallet/contracts/mocks/MockOracle')
const LinkToken = artifacts.require('skill-wallet/contracts/mocks/LinkToken')
const SkillWallet = artifacts.require('skill-wallet/contracts/main/SkillWallet')

const Gigs = artifacts.require('Gigs')
const AddressProvider = artifacts.require('AddressProvider')
const metadataUrl =
  'https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice'
var BN = web3.utils.BN;

let skillWallet;
let mockOracle;
let gigs;

contract('Gigs', function ([
  _,
  registryFunder,
  creator,
  firstMember,
  secondMember,
  thirdMember,
  notAMember
]) {

  const Action = {
    Activate: 0,
    Login: 1,
    CreateGig: 2,
    TakeGig: 3,
    SubmitGig: 4,
    CompleteGig: 5
  }

  const GigStatus = {
    Open: 0,
    Taken: 1,
    Submitted: 2,
    Completed: 3
  }

  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(registryFunder)
    gigstatuses = await GigStatuses.new()
    AddressProvider.link(gigstatuses)
  })
  beforeEach(async function () {
    async function activateSkillWalletFunc(member) {
      const skillWalletId = await skillWallet.getSkillWalletIdByOwner(
        member,
      )
      const skillWalletActivated = await skillWallet.isSkillWalletActivated(
        skillWalletId,
      )

      if (!skillWalletActivated) {
        const pubKeyTx = await skillWallet.addPubKeyToSkillWallet(
          skillWalletId,
          'pubKey',
          { from: creator },
        )

        const pubKeyEventEmitted =
          pubKeyTx.logs[0].event === 'PubKeyAddedToSkillWallet'
        assert.equal(pubKeyEventEmitted, true)

        await this.linkTokenMock.transfer(
          skillWallet.address,
          '2000000000000000000',
        )
        const validationTx = await skillWallet.validate(
          'signature',
          skillWalletId,
          0,
          [],
          [],
          [],
        )
        const validationRequestIdSentEventEmitted =
          validationTx.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted)
        const requestId = validationTx.logs[0].args[0]

        const fulfilTx = await mockOracle.fulfillOracleRequest(
          requestId,
          true,
        )
        const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

        assert.isTrue(fulfilTxEventEmitted)
        const isSWActivated = await skillWallet.isSkillWalletActivated(
          skillWalletId,
        )
        assert.isTrue(isSWActivated)
      }
    }

    const activateSkillWallet = activateSkillWalletFunc.bind(this)
    // SkillWallet
    this.linkTokenMock = await LinkToken.new()
    mockOracle = await MockOracle.new(this.linkTokenMock.address)
    skillWallet = await SkillWallet.new(
      this.linkTokenMock.address,
      mockOracle.address,
      { from: creator },
    )

    this.addressProvder = await AddressProvider.new()
    this.communityFactory = await CommunityFactory.new(1);
    this.distirbutedTown = await DistributedTown.new(
      'http://someurl.co',
      skillWallet.address,
      this.addressProvder.address,
      this.communityFactory.address,
      { from: creator },
    )
    await this.distirbutedTown.deployGenesisCommunities(0, { from: creator })
    await this.distirbutedTown.deployGenesisCommunities(1, { from: creator })
    const communities = await this.distirbutedTown.getCommunities()
    this.community = await Community.at(communities[0])
    this.secondCommunity = await Community.at(communities[1])
    this.ditoCreditCommunityHolder = await this.community.ditoCreditsHolder()
    const gigsAddr = await this.community.gigsAddr()
    gigs = await Gigs.at(gigsAddr)
    await this.community.joinNewMember(
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: firstMember },
    )
    await this.community.joinNewMember(
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: secondMember },
    )
    await this.community.joinNewMember(
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: thirdMember },
    )

    await this.secondCommunity.joinNewMember(
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: notAMember },
    )

    await skillWallet.claim({ from: firstMember });
    await skillWallet.claim({ from: secondMember });
    await skillWallet.claim({ from: thirdMember });
    await skillWallet.claim({ from: notAMember });

    await activateSkillWallet(firstMember)
    await activateSkillWallet(secondMember)
    await activateSkillWallet(thirdMember)
    await activateSkillWallet(notAMember)
    
    this.firstMemberSWId = await skillWallet.getSkillWalletIdByOwner(firstMember);
    this.secondMemberSWId = await skillWallet.getSkillWalletIdByOwner(secondMember);
    this.thirdMemberSWId = await skillWallet.getSkillWalletIdByOwner(thirdMember);
    this.notAMemberSWId = await skillWallet.getSkillWalletIdByOwner(notAMember);

    assert.isTrue(await skillWallet.isSkillWalletActivated(this.firstMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(this.secondMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(this.thirdMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(this.notAMemberSWId));
    assert.isTrue(await this.community.isMember(firstMember));
    assert.isTrue(await this.community.isMember(secondMember));
    assert.isTrue(await this.community.isMember(thirdMember));
    assert.isFalse(await this.community.isMember(notAMember));
  })

  describe('Gigs flow', async function () {
    describe('Creating a gig', async function () {
      it("should when the member or params are invalid", async function () {
        await truffleAssert.reverts(
          gigs.createGig(web3.utils.toWei(new BN(500)), '', { from: notAMember }),
          "The creator of the gig should be a member of the community."
        );

        await truffleAssert.reverts(
          gigs.createGig(web3.utils.toWei(new BN(5000)), '', { from: firstMember }),
          "Invalid credits amount."
        );

        await truffleAssert.reverts(
          gigs.createGig(web3.utils.toWei(new BN(2)), '', { from: firstMember }),
          "Invalid credits amount."
        );
      })

      it("should fail when the creator doesn't have enough credits", async function () {
        const creditsHolderBalanceBefore = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        await gigs.createGig(web3.utils.toWei(new BN(720)), '', { from: firstMember });
        await gigs.createGig(web3.utils.toWei(new BN(720)), '', { from: firstMember });

        const creatorBalance = await this.community.balanceOf(firstMember)
        assert.equal(
          creatorBalance.toString(),
          web3.utils.toWei(new BN(566)).toString(),
        )
        const creditsHolderBalanceAfter = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        assert.equal(
          +web3.utils.fromWei(creditsHolderBalanceBefore.toString()) + 1440,
          +web3.utils.fromWei(creditsHolderBalanceAfter.toString()),
        )
        await truffleAssert.reverts(
          gigs.createGig(web3.utils.toWei(new BN(720)), '', { from: firstMember }),
          "Insufficient dito balance"
        );
      })

      it('should create a gig and transfer the credits correctly', async function () {
        const balanceBefore = await this.community.balanceOf(firstMember);
        const balanceCreditsHolderBefore = await this.community.balanceOf(this.ditoCreditCommunityHolder);

        const creditsAmount = 50;
        const tx = await gigs.createGig(
          web3.utils.toWei(new BN(creditsAmount)),
          metadataUrl,
          { from: firstMember }
        );
        const gigtCreatedEvent = tx.logs[1].event === 'GigCreated'
        const creator = tx.logs[1].args[0];
        const gigId = tx.logs[1].args[1];
        const balanceAfter = await this.community.balanceOf(firstMember);
        const balanceCreditsHolderAfter = await this.community.balanceOf(this.ditoCreditCommunityHolder);

        assert.equal(gigtCreatedEvent, true);
        assert.equal((+web3.utils.fromWei(balanceBefore.toString()) - creditsAmount), +web3.utils.fromWei(balanceAfter.toString()));
        assert.equal((+web3.utils.fromWei(balanceCreditsHolderBefore.toString()) + creditsAmount), +web3.utils.fromWei(balanceCreditsHolderAfter.toString()));
        assert.equal(creator.toString(), firstMember);

        const gig = await gigs.gigs(
          gigId
        );

        assert.equal(gig.creator, firstMember);
        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000');
        assert.equal(gig.status, GigStatus.Open);
        assert.equal(gig.ditoCredits.toString(), web3.utils.toWei(new BN(50)).toString());
      });
    })

    describe('Take a gig', async function () {
      it('should fail when the params are wrong', async function () {
        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        await truffleAssert.reverts(
          gigs.takeGig(gigId, { from: firstMember }),
          "The creator can't take the gig"
        );

        await truffleAssert.reverts(
          gigs.takeGig(gigId, { from: notAMember }),
          "The taker should be a community member."
        );

        await truffleAssert.reverts(
          gigs.takeGig(120, { from: secondMember }),
          "Invalid gigId"
        );

        const tx = await gigs.takeGig(
          gigId,
          { from: secondMember }
        );

        assert.isTrue(tx.logs[0].event === 'GigTaken');
        assert.equal(gigId.toString(), tx.logs[0].args[0].toString());

        await truffleAssert.reverts(
          gigs.takeGig(gigId, { from: thirdMember }),
          "The gig is already taken."
        );
      })
      it('should succeed taking a gig and should update the state properly', async function () {
        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        const tx = await gigs.takeGig(
          gigId,
          { from: secondMember }
        );

        const takenGigId = tx.logs[0].args[0];

        assert.equal(gigId.toString(), takenGigId.toString());

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember);
        assert.equal(gig.creator, firstMember);
        assert.equal(gig.status, GigStatus.Taken);

      })
    })

    describe('Submit a gig', async function () {
      it('should fail when the params are wrong', async function () {
        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        await truffleAssert.reverts(
          gigs.submitGig(gigId, { from: firstMember }),
          "Gig should be with status taken."
        );

        await gigs.takeGig(gigId, { from: secondMember });

        await truffleAssert.reverts(
          gigs.submitGig(gigId, { from: thirdMember }),
          "Only the taker can submit the gig"
        );

        await truffleAssert.reverts(
          gigs.submitGig(gigId, { from: firstMember }),
          "Only the taker can submit the gig"
        );

        await truffleAssert.reverts(
          gigs.submitGig(120, { from: secondMember }),
          "Invalid gigId"
        );

        const tx = await gigs.submitGig(
          gigId,
          { from: secondMember }
        );

        assert.isTrue(tx.logs[0].event === 'GigSubmitted');
        assert.equal(gigId.toString(), tx.logs[0].args[0].toString());

        await truffleAssert.reverts(
          gigs.submitGig(gigId, { from: secondMember }),
          "Gig should be with status taken."
        );
      })
      it('should succeed submitting a gig and should update the state properly', async function () {
        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        const takeGigtx = await gigs.takeGig(
          gigId,
          { from: secondMember }
        );

        const takenGigId = takeGigtx.logs[0].args[0];

        assert.equal(gigId.toString(), takenGigId.toString());

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember);
        assert.equal(gig.creator, firstMember);
        assert.equal(gig.status, GigStatus.Taken);


        const submitGigTx = await gigs.submitGig(
          gigId,
          { from: secondMember }
        );

        const submittedGigId = submitGigTx.logs[0].args[0];

        assert.equal(gigId.toString(), submittedGigId.toString());

        const gigSubmitted = await gigs.gigs(gigId);

        assert.equal(gigSubmitted.taker, secondMember);
        assert.equal(gigSubmitted.creator, firstMember);
        assert.equal(gigSubmitted.status, GigStatus.Submitted);
      });
    })

    describe('Complete a gig', async function () {
      it('should fail when the params are wrong', async function () {

        await truffleAssert.reverts(
          gigs.completeGig(120, { from: secondMember }),
          "Invalid gigId"
        );

        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        await truffleAssert.reverts(
          gigs.completeGig(gigId, { from: firstMember }),
          "Gig status should be Submitted."
        );

        await gigs.takeGig(gigId, { from: secondMember });

        await truffleAssert.reverts(
          gigs.completeGig(gigId, { from: firstMember }),
          "Gig status should be Submitted."
        );

        await gigs.submitGig(gigId, { from: secondMember });

        await truffleAssert.reverts(
          gigs.completeGig(gigId, { from: secondMember }),
          "Can be completed only by the creator."
        );

        await truffleAssert.reverts(
          gigs.completeGig(gigId, { from: thirdMember }),
          "Can be completed only by the creator."
        );
      })
      it('should complete a gig and transfer the credits accordingly', async function () {
        const createTx = await gigs.createGig(
          web3.utils.toWei(new BN(50)),
          metadataUrl,
          { from: firstMember }
        );
        const gigId = createTx.logs[1].args[1];

        await gigs.takeGig(gigId, { from: secondMember });
        await gigs.submitGig(gigId, { from: secondMember });

        const takerBalanceBeforeComplete = await this.community.balanceOf(
          secondMember,
        )

        const ditoHolderBalanceBeforeCompletion = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        await gigs.completeGig(gigId, { from: firstMember });


        const takerBalanceAfterComplete = await this.community.balanceOf(
          secondMember,
        )

        const ditoHolderBalanceAfterCompletion = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember);
        assert.equal(gig.creator, firstMember);
        assert.equal(gig.status, GigStatus.Completed);
        assert.equal(
          +web3.utils.fromWei(takerBalanceAfterComplete.toString()),
          +web3.utils.fromWei(takerBalanceBeforeComplete.toString()) +
          +web3.utils.fromWei(gig.ditoCredits.toString()),
        )
        assert.equal(
          +web3.utils.fromWei(ditoHolderBalanceAfterCompletion.toString()),
          +web3.utils.fromWei(ditoHolderBalanceBeforeCompletion.toString()) -
          +web3.utils.fromWei(gig.ditoCredits.toString()),
        )
      });
    })
  })
})
