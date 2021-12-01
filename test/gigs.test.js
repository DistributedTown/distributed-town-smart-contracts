const { singletons } = require('@openzeppelin/test-helpers')
const { assert } = require('chai')
const truffleAssert = require('truffle-assertions')

const metadataUrl =
  'https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice'
var BN = web3.utils.BN;

contract('Gigs', function ([
  _,
  registryFunder,
  creator,
  firstMember,
  secondMember,
  thirdMember,
  notAMember
]) {

  const GigStatus = {
    Open: 0,
    Taken: 1,
    Submitted: 2,
    Completed: 3
  }

  let erc1820;
  let gigs;
  let community;
  let skillWallet;
  let mockOracle;


  beforeEach(async function () {
    [deployer, firstMember, secondMember, thirdMember, notAMember, ...accounts] = await ethers.getSigners();
    const GigStatuses = await ethers.getContractFactory("GigStatuses");
    const DistributedTown = await ethers.getContractFactory("DistributedTown");
    const Community = await ethers.getContractFactory('Community');

    // SW
    const SkillWallet = await ethers.getContractFactory('SkillWallet');
    const OSM = await ethers.getContractFactory('OffchainSignatureMechanism');
    const LinkToken = await ethers.getContractFactory("LinkToken");
    const MockOracle = await ethers.getContractFactory("MockOracle");
    const CommunityFactory = await ethers.getContractFactory("CommunityFactory");

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
    await addressProvder.deployed();


    const communityFactory = await CommunityFactory.deploy([1]);
    await communityFactory.deployed();

    linkTokenMock = await LinkToken.deploy();
    await linkTokenMock.deployed();

    mockOracle = await MockOracle.deploy(linkTokenMock.address);
    await mockOracle.deployed();

    skillWallet = await upgrades.deployProxy(
      SkillWallet,
      [linkTokenMock.address, mockOracle.address],
  );


    await skillWallet.deployed();

    distributedTown = await upgrades.deployProxy(
      DistributedTown,
      ['http://someurl.co', skillWallet.address, addressProvder.address, communityFactory.address],
    );

    await distributedTown.deployed();

    async function activateSkillWallet(member) {
      const skillWalletId = await skillWallet.getSkillWalletIdByOwner(
        member.address,
      )
      const skillWalletActivated = await skillWallet.isSkillWalletActivated(
        skillWalletId,
      )

      if (!skillWalletActivated) {
        const pubKeyTx = await (await skillWallet.connect(deployer).addPubKeyToSkillWallet(
          skillWalletId,
          'pubKey',
        )).wait();

        const pubKeyEventEmitted = pubKeyTx.events.find(e => e.event == 'PubKeyAddedToSkillWallet');
        assert.isNotNull(pubKeyEventEmitted)


        const osm = await OSM.attach(await skillWallet.getOSMAddress());

        await linkTokenMock.transfer(
          osm.address,
          '2000000000000000000',
        )
        const validationTx = await (await osm.validate(
          'signature',
          skillWalletId,
          0,
          [],
          [],
          [],
        )).wait();

        const validationRequestIdSentEventEmitted = validationTx.events.find(e => e.event == 'ValidationRequestIdSent');
        assert.isNotNull(validationRequestIdSentEventEmitted)

        const requestId = validationRequestIdSentEventEmitted.args.requestId;

        const fulfilTx = await (await mockOracle["fulfillOracleRequest(bytes32,bool)"](
          requestId,
          true
        )).wait();

        const fulfilTxEventEmitted = fulfilTx.events.find(e => e.event == 'CallbackCalled');
        assert.isNotNull(fulfilTxEventEmitted)

        const isSWActivated = await skillWallet.isSkillWalletActivated(
          skillWalletId,
        )
        assert.isTrue(isSWActivated)
      }
    }

    await (await distributedTown.deployGenesisCommunities(0)).wait();
    await (await distributedTown.deployGenesisCommunities(1)).wait();

    const communities = await distributedTown.getCommunities()
    community = await Community.attach(communities[0])
    secondCommunity = await Community.attach(communities[1])
    ditoCreditCommunityHolder = await community.ditoCreditsHolder()
    const gigsAddr = await community.gigsAddr()
    gigs = await Gigs.attach(gigsAddr)
    const a = await (await community
      .connect(firstMember)
      .joinNewMember(
        'http://someuri.co',
        1,
        web3.utils.toWei(new BN(2006)).toString(),
      )
    ).wait();
    const memberAddedEvent = a.events.find(e => e.event == 'MemberAdded');
    assert.isNotNull(memberAddedEvent)

    await (await community.connect(secondMember).joinNewMember(
      'http://someuri.co',
      1,
      web3.utils.toWei(new BN(2006)).toString(),
    )).wait();

    await (await community.connect(thirdMember).joinNewMember(
      'http://someuri.co',
      1,
      web3.utils.toWei(new BN(2006)).toString(),
    )).wait();

    await (await secondCommunity.connect(notAMember).joinNewMember(
      'http://someuri.co',
      1,
      web3.utils.toWei(new BN(2006)).toString()
    )).wait();

    await skillWallet.connect(firstMember).claim();
    await skillWallet.connect(secondMember).claim();
    await skillWallet.connect(thirdMember).claim();
    await skillWallet.connect(notAMember).claim();

    await activateSkillWallet(firstMember)
    await activateSkillWallet(secondMember)
    await activateSkillWallet(thirdMember)
    await activateSkillWallet(notAMember)

    firstMemberSWId = await skillWallet.getSkillWalletIdByOwner(firstMember.address);
    secondMemberSWId = await skillWallet.getSkillWalletIdByOwner(secondMember.address);
    thirdMemberSWId = await skillWallet.getSkillWalletIdByOwner(thirdMember.address);
    notAMemberSWId = await skillWallet.getSkillWalletIdByOwner(notAMember.address);

    assert.isTrue(await skillWallet.isSkillWalletActivated(firstMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(secondMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(thirdMemberSWId));
    assert.isTrue(await skillWallet.isSkillWalletActivated(notAMemberSWId));
    assert.isTrue(await community.isMember(firstMember.address));
    assert.isTrue(await community.isMember(secondMember.address));
    assert.isTrue(await community.isMember(thirdMember.address));
    assert.isFalse(await community.isMember(notAMember.address));
  })

  describe('Gigs flow', async function () {
    describe('Creating a gig', async function () {
      it("should when the member or params are invalid", async function () {
        await truffleAssert.reverts(
          gigs.connect(notAMember).createGig(web3.utils.toWei(new BN(500)).toString(), ''),
          "The creator of the gig should be a member of the community."
        );

        await truffleAssert.reverts(
          gigs.connect(firstMember).createGig(web3.utils.toWei(new BN(5000)).toString(), ''),
          "Invalid credits amount."
        );

        await truffleAssert.reverts(
          gigs.connect(firstMember).createGig(web3.utils.toWei(new BN(2)).toString(), ''),
          "Invalid credits amount."
        );
      })

      it("should fail when the creator doesn't have enough credits", async function () {
        const creditsHolderBalanceBefore = await community.balanceOf(
          ditoCreditCommunityHolder,
        )

        await gigs.connect(firstMember).createGig(web3.utils.toWei(new BN(720)).toString(), '');
        await gigs.connect(firstMember).createGig(web3.utils.toWei(new BN(720)).toString(), '');

        const creatorBalance = await community.balanceOf(firstMember.address)
        assert.equal(
          creatorBalance.toString(),
          web3.utils.toWei(new BN(566)).toString(),
        )
        const creditsHolderBalanceAfter = await community.balanceOf(
          ditoCreditCommunityHolder,
        )

        assert.equal(
          +web3.utils.fromWei(creditsHolderBalanceBefore.toString()) + 1440,
          +web3.utils.fromWei(creditsHolderBalanceAfter.toString()),
        )
        await truffleAssert.reverts(
          gigs.connect(firstMember).createGig(web3.utils.toWei(new BN(720)).toString(), ''),
          "Insufficient dito balance"
        );
      })

      it('should create a gig and transfer the credits correctly', async function () {
        const balanceBefore = await community.balanceOf(firstMember.address);
        const balanceCreditsHolderBefore = await community.balanceOf(ditoCreditCommunityHolder);

        const creditsAmount = 50;
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(creditsAmount)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)

        const creator = gigtCreatedEvent.args._creator;
        const gigId = gigtCreatedEvent.args._gigId;
        const balanceAfter = await community.balanceOf(firstMember.address);
        const balanceCreditsHolderAfter = await community.balanceOf(ditoCreditCommunityHolder);

        assert.equal((+web3.utils.fromWei(balanceBefore.toString()) - creditsAmount), +web3.utils.fromWei(balanceAfter.toString()));
        assert.equal((+web3.utils.fromWei(balanceCreditsHolderBefore.toString()) + creditsAmount), +web3.utils.fromWei(balanceCreditsHolderAfter.toString()));
        assert.equal(creator.toString(), firstMember.address);

        const gig = await gigs.gigs(
          gigId
        );

        assert.equal(gig.creator, firstMember.address);
        assert.equal(gig.taker, '0x0000000000000000000000000000000000000000');
        assert.equal(gig.status, GigStatus.Open);
        assert.equal(gig.ditoCredits.toString(), web3.utils.toWei(new BN(50)).toString());
      });
    })

    describe('Take a gig', async function () {
      it('should fail when the params are wrong', async function () {
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        await truffleAssert.reverts(
          gigs.connect(firstMember).takeGig(gigId),
          "The creator can't take the gig"
        );

        await truffleAssert.reverts(
          gigs.connect(notAMember).takeGig(gigId),
          "The taker should be a community member."
        );

        await truffleAssert.reverts(
          gigs.connect(secondMember).takeGig(120),
          "Invalid gigId"
        );

        const takeTx = await (await gigs.connect(secondMember).takeGig(
          gigId,
        )).wait();

        const eventEmitted = takeTx.events.find(e => e.event == 'GigTaken');
        assert.isNotNull(eventEmitted);
        assert.equal(gigId.toString(), eventEmitted.args._gigId);

        await truffleAssert.reverts(
          gigs.connect(thirdMember).takeGig(gigId),
          "The gig is already taken."
        );
      })
      it('should succeed taking a gig and should update the state properly', async function () {
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        const takeTx = await (await gigs.connect(secondMember).takeGig(
          gigId,
        )).wait();

        const eventEmitted = takeTx.events.find(e => e.event == 'GigTaken');
        assert.isNotNull(eventEmitted);
        assert.equal(gigId.toString(), eventEmitted.args._gigId);
        const takenGigId = eventEmitted.args._gigId;

        assert.equal(gigId.toString(), takenGigId.toString());

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember.address);
        assert.equal(gig.creator, firstMember.address);
        assert.equal(gig.status, GigStatus.Taken);

      })
    })

    describe('Submit a gig', async function () {
      it('should fail when the params are wrong', async function () {
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        await truffleAssert.reverts(
          gigs.connect(firstMember).submitGig(gigId),
          "Gig should be with status taken."
        );

        await (await gigs.connect(secondMember).takeGig(gigId)).wait();

        await truffleAssert.reverts(
          gigs.connect(thirdMember).submitGig(gigId),
          "Only the taker can submit the gig"
        );

        await truffleAssert.reverts(
          gigs.connect(firstMember).submitGig(gigId),
          "Only the taker can submit the gig"
        );

        await truffleAssert.reverts(
          gigs.connect(secondMember).submitGig(120),
          "Invalid gigId"
        );

        const submitTx = await (await gigs.connect(secondMember).submitGig(
          gigId,
        )).wait();


        const submittedEvent = submitTx.events.find(e => e.event == 'GigSubmitted');
        assert.isNotNull(submittedEvent)

        assert.equal(gigId.toString(), submittedEvent.args._gigId);

        await truffleAssert.reverts(
          gigs.connect(secondMember).submitGig(gigId),
          "Gig should be with status taken."
        );
      })
      it('should succeed submitting a gig and should update the state properly', async function () {
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        const takeGigtx = await (await gigs.connect(secondMember).takeGig(
          gigId,
        )).wait()

        assert.equal(gigId.toString(), takeGigtx.events.find(e => e.event == 'GigTaken').args._gigId);

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember.address);
        assert.equal(gig.creator, firstMember.address);
        assert.equal(gig.status, GigStatus.Taken);


        const submitGigTx = await (
          await gigs.connect(secondMember).submitGig(
            gigId,
          )).wait()

        assert.equal(gigId.toString(), submitGigTx.events.find(e => e.event == 'GigSubmitted').args._gigId);

        const gigSubmitted = await gigs.gigs(gigId);

        assert.equal(gigSubmitted.taker, secondMember.address);
        assert.equal(gigSubmitted.creator, firstMember.address);
        assert.equal(gigSubmitted.status, GigStatus.Submitted);
      });
    })

    describe('Complete a gig', async function () {
      it('should fail when the params are wrong', async function () {
        await truffleAssert.reverts(
          gigs.connect(secondMember).completeGig(120),
          "Invalid gigId"
        );
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        await truffleAssert.reverts(
          gigs.connect(firstMember).completeGig(gigId),
          "Gig status should be Submitted."
        );

        const takeGigtx = await (await gigs.connect(secondMember).takeGig(
          gigId,
        )).wait()

        assert.equal(gigId.toString(), takeGigtx.events.find(e => e.event == 'GigTaken').args._gigId);

        await truffleAssert.reverts(
          gigs.connect(firstMember).completeGig(gigId),
          "Gig status should be Submitted."
        );

        await (await gigs.connect(secondMember).submitGig(gigId)).wait()

        await truffleAssert.reverts(
          gigs.connect(secondMember).completeGig(gigId),
          "Can be completed only by the creator."
        );

        await truffleAssert.reverts(
          gigs.connect(thirdMember).completeGig(gigId),
          "Can be completed only by the creator."
        );
      })
      it('should complete a gig and transfer the credits accordingly', async function () {
        const tx = await (await gigs
          .connect(firstMember)
          .createGig(
            web3.utils.toWei(new BN(50)).toString(),
            metadataUrl
          )).wait();

        const gigtCreatedEvent = tx.events.find(e => e.event == 'GigCreated');
        assert.isNotNull(gigtCreatedEvent)
        const gigId = gigtCreatedEvent.args._gigId;

        await (await gigs.connect(secondMember).takeGig(gigId)).wait();
        await (await gigs.connect(secondMember).submitGig(gigId)).wait();

        const takerBalanceBeforeComplete = await community.balanceOf(
          secondMember.address,
        )

        const ditoHolderBalanceBeforeCompletion = await community.balanceOf(
          ditoCreditCommunityHolder,
        )

        await (await gigs.connect(firstMember).completeGig(gigId)).wait();


        const takerBalanceAfterComplete = await community.balanceOf(
          secondMember.address,
        )

        const ditoHolderBalanceAfterCompletion = await community.balanceOf(
          ditoCreditCommunityHolder,
        )

        const gig = await gigs.gigs(gigId);

        assert.equal(gig.taker, secondMember.address);
        assert.equal(gig.creator, firstMember.address);
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
