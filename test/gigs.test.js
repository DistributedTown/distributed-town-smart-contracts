const { singletons } = require('@openzeppelin/test-helpers')
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')

const GigStatuses = artifacts.require('GigStatuses')
const DistributedTown = artifacts.require('DistributedTown')
const Community = artifacts.require('Community')

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

  async function createGigSuccessfullyFunc(swId, ditoCredits) {
    let createGigValidationTx = await skillWallet.validate(
      'signature',
      swId,
      Action.CreateGig,
      ['http://...'],
      [web3.utils.toWei(new BN(ditoCredits))],
      [],
    )

    let validationRequestIdSentEventEmitted =
      createGigValidationTx.logs[1].event === 'ValidationRequestIdSent'
    assert.isTrue(validationRequestIdSentEventEmitted)

    const requestId = createGigValidationTx.logs[0].args[0]
    const fulfilTx = await mockOracle.fulfillOracleRequest(
      requestId,
      true,
    )
    const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

    assert.isTrue(fulfilTxEventEmitted)

    const gigId = (await gigs.gigsCount()) - 1
    const gig = await gigs.gigs(gigId)

    assert.equal(gig.creator, firstMember)
    assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
    assert.equal(gig.status, GigStatus.Open)
    assert.equal(
      gig.ditoCredits.toString(),
      web3.utils.toWei(new BN(ditoCredits)).toString(),
    )
  }
  async function createGigFunc(swId, ditoCredits) {
    let createGigValidationTx = await skillWallet.validate(
      'signature',
      swId,
      Action.CreateGig,
      ['http://...'],
      [web3.utils.toWei(new BN(ditoCredits))],
      [],
    )

    let validationRequestIdSentEventEmitted =
      createGigValidationTx.logs[1].event === 'ValidationRequestIdSent'
    assert.isTrue(validationRequestIdSentEventEmitted)

    const requestId = createGigValidationTx.logs[0].args[0]
    const fulfilTx = await mockOracle.fulfillOracleRequest(
      requestId,
      true,
    )
    const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

    assert.isTrue(fulfilTxEventEmitted)
  }
  async function doActionFunc(gigID, user, action) {
    let takeGigValidationTx = await skillWallet.validate(
      'signature',
      user,
      action,
      [],
      [gigID],
      [],
    )

    let validationRequestIdSentEventEmitted =
      takeGigValidationTx.logs[1].event === 'ValidationRequestIdSent'
    assert.isTrue(validationRequestIdSentEventEmitted)

    const requestId = takeGigValidationTx.logs[0].args[0]
    const fulfilTx = await mockOracle.fulfillOracleRequest(
      requestId,
      true,
    )

    const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'
    assert.isTrue(fulfilTxEventEmitted)
  }
  async function doActionSuccessfullyFunc(gigID, user, action) {
    let takeGigValidationTx = await skillWallet.validate(
      'signature',
      user,
      action,
      [],
      [gigID],
      [],
    )

    let validationRequestIdSentEventEmitted =
      takeGigValidationTx.logs[1].event === 'ValidationRequestIdSent'
    assert.isTrue(validationRequestIdSentEventEmitted)

    const requestId = takeGigValidationTx.logs[0].args[0]
    const fulfilTx = await mockOracle.fulfillOracleRequest(
      requestId,
      true,
    )

    const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'
    assert.isTrue(fulfilTxEventEmitted)

    const gig = await gigs.gigs(gigID)
    const userAddress = await skillWallet.ownerOf(user);

    switch(action) {
      case(Action.TakeGig): {
        assert.equal(gig.status, GigStatus.Taken);
        assert.equal(gig.taker, userAddress);
        break;
      }
      case(Action.SubmitGig): {
        assert.equal(gig.status, GigStatus.Submitted);
        assert.equal(gig.taker, userAddress);
        break;
      }
      case(Action.CompleteGig): {
        assert.equal(gig.status, GigStatus.Completed);
        assert.equal(gig.creator, userAddress);
        break;
      }
    }

  }

  const doAction = doActionFunc.bind(this);
  const createGig = createGigFunc.bind(this);
  const doActionSuccessfully = doActionSuccessfullyFunc.bind(this);
  const createGigSuccessfully = createGigSuccessfullyFunc.bind(this)

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
    this.distirbutedTown = await DistributedTown.new(
      'http://someurl.co',
      skillWallet.address,
      this.addressProvder.address,
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
      1,
      1,
      2,
      2,
      3,
      3,
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: firstMember },
    )
    await this.community.joinNewMember(
      1,
      1,
      2,
      2,
      3,
      3,
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: secondMember },
    )
    await this.community.joinNewMember(
      1,
      1,
      2,
      2,
      3,
      3,
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: thirdMember },
    )

    await this.secondCommunity.joinNewMember(
      1,
      1,
      2,
      2,
      3,
      3,
      'http://someuri.co',
      web3.utils.toWei(new BN(2006)),
      { from: notAMember },
    )
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

  describe.only('Gigs flow', async function () {
    describe('Creating a gig', async function () {
      it('should fail when called directly', async function () {
        const tx = gigs.createGig(
          '0x093ECac1110EF08976A0A1F24393c3e48936489D',
          web3.utils.toWei(new BN(200)),
          metadataUrl,
        )

        await truffleAssert.reverts(tx, 'Only SWActionExecutor can call this.')
      })
      it("should fail when the gig creator isn't a community member", async function () {
        const currentCount = await gigs.gigsCount();
        await createGig(this.notAMemberSWId, 60);
        const afterCreateCallCount = await gigs.gigsCount();
        assert.equal(currentCount.toString(), afterCreateCallCount.toString());

      })
      it('should fail when the params are not correct', async function () {
        const gig = await gigs.gigs(0)
        assert.equal(gig.creator, '0x0000000000000000000000000000000000000000')

        const validationTx1 = await skillWallet.validate(
          'signature',
          3,
          Action.CreateGig,
          ['http://...'],
          [2],
          [],
        )
        const validationRequestIdSentEventEmitted =
          validationTx1.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted)

        await mockOracle.fulfillOracleRequest(
          validationTx1.logs[0].args[0],
          true,
        )

        const validationTx2 = await skillWallet.validate(
          'signature',
          3,
          Action.CreateGig,
          ['http://...'],
          [],
          [],
        )
        const validationRequestIdSentEventEmitted2 =
          validationTx2.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted2)

        await mockOracle.fulfillOracleRequest(
          validationTx2.logs[0].args[0],
          true,
        )
        const validationTx3 = await skillWallet.validate(
          'signature',
          3,
          Action.CreateGig,
          ['http://...'],
          [2000],
          [],
        )
        const validationRequestIdSentEventEmitted3 =
          validationTx3.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted3)

        await mockOracle.fulfillOracleRequest(
          validationTx3.logs[0].args[0],
          true,
        )
        const validationTx4 = await skillWallet.validate(
          'signature',
          3,
          Action.CreateGig,
          [],
          [700],
          [],
        )
        const validationRequestIdSentEventEmitted4 =
          validationTx4.logs[1].event === 'ValidationRequestIdSent'
        assert.isTrue(validationRequestIdSentEventEmitted4)

        const fulfilTx = await mockOracle.fulfillOracleRequest(
          validationTx4.logs[0].args[0],
          true,
        )
        const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'

        assert.isTrue(fulfilTxEventEmitted)

        const gigAfter = await gigs.gigs(0)
        assert.equal(
          gigAfter.creator,
          '0x0000000000000000000000000000000000000000',
        )
      })
      it("should fail when the creator doesn't have enough credits", async function () {
        const creditsHolderBalanceBefore = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        await createGigSuccessfully(this.firstMemberSWId, 720)
        await createGigSuccessfully(this.firstMemberSWId, 720)

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

        const gigsCountBefore = await gigs.gigsCount()
        assert.equal(gigsCountBefore, 2)
        await createGig(this.firstMemberSWId, 720)
        const gigsCountAfter = await gigs.gigsCount()

        assert.equal(gigsCountBefore.toString(), gigsCountAfter.toString())
      })
      it('should create a gig and transfer the credits correctly', async function () {
        const balanceBefore = await this.community.balanceOf(firstMember)
        const balanceCreditsHolderBefore = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        const creditsAmount = 50
        await createGigSuccessfully(this.firstMemberSWId, creditsAmount);

        const balanceAfter = await this.community.balanceOf(firstMember)
        const balanceCreditsHolderAfter = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        assert.equal(
          +web3.utils.fromWei(balanceBefore.toString()) - creditsAmount,
          +web3.utils.fromWei(balanceAfter.toString()),
        )
        assert.equal(
          +web3.utils.fromWei(balanceCreditsHolderBefore.toString()) +
          creditsAmount,
          +web3.utils.fromWei(balanceCreditsHolderAfter.toString()),
        )

        const gigId = (await gigs.gigsCount()) - 1
        const gig = await gigs.gigs(gigId)

        assert.equal(gig.creator, firstMember)
        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.status, GigStatus.Open)
        assert.equal(
          gig.ditoCredits.toString(),
          web3.utils.toWei(new BN(50)).toString(),
        )
      })
    })

    describe('Take a gig', async function () {
      it('should fail when called directly', async function () {
        const tx = gigs.takeGig(1, firstMember)

        await truffleAssert.reverts(tx, 'Only SWActionExecutor can call this.')
      })
      it('should fail when the gig creator tries to take the gig', async function () {
        await createGigSuccessfully(this.firstMemberSWId, 50);
        const gigID = (await gigs.gigsCount()) - 1

        await doAction(gigID, this.firstMemberSWId, Action.TakeGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.creator, firstMember)
        assert.equal(gig.status, GigStatus.Open);
      })
      it("should fail when the gig doesn't exist yet", async function () {
        const gigID = 120

        await doAction(gigID, this.secondMemberSWId, Action.TakeGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.creator, '0x0000000000000000000000000000000000000000')
      })
      it("should fail when the taker isn't a community member", async function () {
        await createGigSuccessfully(this.firstMemberSWId, 60);
        const gigID = await gigs.gigsCount() - 1;

        await doAction(gigID, this.notAMemberSWId, Action.TakeGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.creator, firstMember)
        assert.equal(gig.status, GigStatus.Open);

      })
      it('should fail when the gig is already taken', async function () {
        await createGigSuccessfully(this.firstMemberSWId, 50);
        const gigID = (await gigs.gigsCount()) - 1;

        await doAction(gigID, this.secondMemberSWId, Action.TakeGig);

        const gigBefore = await gigs.gigs(gigID)

        assert.equal(gigBefore.status.toString(), '1');
        assert.equal(gigBefore.taker, secondMember)

        await doAction(gigID, this.thirdMemberSWId, Action.TakeGig);

        const gigAfter = await gigs.gigs(gigID)
        assert.equal(gigAfter.status.toString(), '1')
        assert.equal(gigAfter.taker, secondMember)
        assert.equal(gigAfter.creator, firstMember)
      })
      it('should succeed taking a gig and should update the state properly', async function () {
        await createGigSuccessfully(this.firstMemberSWId, 50)
        const gigID = (await gigs.gigsCount()) - 1;
        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.TakeGig);
      })
    })

    describe('Submit a gig', async function () {
      it('should fail when called directly', async function () {
        const tx = gigs.submitGig(
          1,
          secondMember
        )

        await truffleAssert.reverts(tx, 'Only SWActionExecutor can call this.')
      })
      it('should fail when the sender is not the taker', async function () {
        const creditsAmount = 60;
        await createGigSuccessfully(this.firstMemberSWId, creditsAmount);
        const gigID = (await gigs.gigsCount()) - 1;
        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.TakeGig);

        await doAction(gigID, this.thirdMemberSWId, Action.SubmitGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.creator, firstMember)
        assert.equal(gig.taker, secondMember)
        assert.equal(gig.status, GigStatus.Taken)
        assert.equal(
          gig.ditoCredits.toString(),
          web3.utils.toWei(new BN(creditsAmount)).toString(),
        )
      })
      it("should fail when the gig doesn't exist yet", async function () {
        const gigID = 120;

        await doAction(gigID, this.thirdMemberSWId, Action.SubmitGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.creator, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
      })
      it("should fail when the gig isn't taken yet", async function () {

        await createGigSuccessfully(this.firstMemberSWId, 60);
        const gigID = (await gigs.gigsCount()) - 1;

        await doAction(gigID, this.firstMemberSWId, Action.SubmitGig);

        const gigAfter = await gigs.gigs(gigID)

        assert.equal(gigAfter.creator, firstMember)
        assert.equal(gigAfter.taker, '0x0000000000000000000000000000000000000000')
        assert.equal(gigAfter.status, GigStatus.Open)

      })
      it('should succeed submitting a gig and should update the state properly', async function () {
        await createGigSuccessfully(this.firstMemberSWId, 60);
        const gigID = (await gigs.gigsCount()) - 1;

        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.TakeGig);
        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.SubmitGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.creator, firstMember)
        assert.equal(gig.taker, secondMember)
        assert.equal(gig.status, GigStatus.Submitted)
      })
    })

    describe('Complete a gig', async function () {
      it('should fail when called directly', async function () {
        const tx = gigs.completeGig(
          1,
          secondMember
        )
        await truffleAssert.reverts(tx, 'Only SWActionExecutor can call this.')
      })

      it("should fail when the gig doesn't exist yet", async function () {
        const gigID = 120;
        await doAction(gigID, this.firstMemberSWId, Action.CompleteGig);

        const gig = await gigs.gigs(gigID);
        assert.equal(gig.creator, '0x0000000000000000000000000000000000000000')
        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000')
      })

      it("should fail when the completor isn't the creator", async function () {

        await createGigSuccessfully(this.firstMemberSWId, 60);
        const gigID = await gigs.gigsCount() - 1;

        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.TakeGig);
        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.SubmitGig);

        await doAction(gigID, this.secondMemberSWId, Action.CompleteGig);
        await doAction(gigID, this.thirdMemberSWId, Action.CompleteGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.creator, firstMember)
        assert.equal(gig.taker, secondMember)
        assert.equal(gig.status, GigStatus.Submitted)

      })

      it('should complete a gig and transfer the credits accordingly', async function () {
        const credits = 60;
        await createGigSuccessfully(this.firstMemberSWId, credits);
        const gigID = await gigs.gigsCount() - 1;

        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.TakeGig);
        await doActionSuccessfully(gigID, this.secondMemberSWId, Action.SubmitGig);

        const takerBalanceBeforeComplete = await this.community.balanceOf(
          secondMember,
        )

        const ditoHolderBalanceBeforeCompletion = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

        await doActionSuccessfully(gigID, this.firstMemberSWId, Action.CompleteGig);

        const gig = await gigs.gigs(gigID)

        assert.equal(gig.creator, firstMember)
        assert.equal(gig.taker, secondMember)
        assert.equal(gig.status, GigStatus.Completed)
        assert.equal(
          gig.ditoCredits.toString(),
          web3.utils.toWei(new BN(credits)).toString(),
        )

        const takerBalanceAfterComplete = await this.community.balanceOf(
          secondMember,
        )
        const ditoHolderBalanceAfterCompletion = await this.community.balanceOf(
          this.ditoCreditCommunityHolder,
        )

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
      })
    })
  })
})
