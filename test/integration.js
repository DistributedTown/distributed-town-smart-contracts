const skillWalletAddress = "0xdC8fDfBdddcce3b8DfFc345Bd426789a7b2534A1";
const communityAddress = "0x8d67dBEF4F5259B48BFb35458174bEaeE60734b8";

const { assert } = require("chai");
var ethers = require("ethers");

var communityAbi = require("../artifacts/contracts/community/Community.sol/Community.json")
  .abi;

var gigsAbi = require("../artifacts/contracts/gigs/Gigs.sol/Gigs.json").abi;
var skillWalletAbi = require("./skillWalletAbi.json").abi;

const helpers = require("../test/helpers");
const fs = require("fs");

function mnemonic() {
  try {
    return fs.readFileSync("./mnemonic.txt").toString().trim();
  } catch (e) {
    console.log(e);
  }
  return "";
}

let keyPair = {
  pubKey:
    "0442f1fa140d9fcb8ddca188ffc83d1512bcb3be4de464512169c4555f3f7a6ca5e3afb51f7604cdbbf4234b6958852d0b4c57b0ba18af4350a652e889f7f6660a",
};

const provider = new ethers.providers.JsonRpcProvider(
  // 'https://polygon-rpc.com/'
  "https://matic-mumbai.chainstacklabs.com/"
);

// Wallet connected to a provider
const senderWalletMnemonic = ethers.Wallet.fromMnemonic(
  mnemonic(),
  "m/44'/60'/0'/0/0"
);

let signer = senderWalletMnemonic.connect(provider);

const skillWalletContract = new ethers.Contract(skillWalletAddress, skillWalletAbi, signer)

const communityContract = new ethers.Contract(
  communityAddress,
  communityAbi,
  signer
);

async function joinCommunity() {
  // const newKeyPair = helpers.generateKeyPair();
  // keyPair = newKeyPair;

  const url =
    "https://hub.textile.io/ipfs/bafkreicezefuc6einewxdqhlpefelzjponwdqt4vmp2byosq5uwpn7hgoq";
  const joinedTx = await communityContract.joinNewMember(url, 1);
  const joinCommunityTxResult = await joinedTx.wait();
  const { events } = joinCommunityTxResult;
  const memberAddedEventEmitted = events.find((e) => e.event === "MemberAdded");

  assert.isOk(memberAddedEventEmitted, "MemberAdded event emitted");
  console.log("[joinCommunity]:", "MemberAdded event emitted");
  assert.isAbove(+memberAddedEventEmitted.args[1], -1, "TokenID is valid");
  console.log("[joinCommunity]:", "TokenID is valid");
  return memberAddedEventEmitted.args[1];
}


async function claim() {
  // const newKeyPair = helpers.generateKeyPair();
  // keyPair = newKeyPair;

  const claimTx = await skillWalletContract.claim();
  const claimTxResult = await claimTx.wait();
  const { events } = claimTxResult;
  const claimEventEmitted = events.find((e) => e.event === "SkillWalletClaimed");

  assert.isOk(claimEventEmitted, "SkillWalletClaimed event emitted");
  console.log("[claim]:", "SkillWalletClaimed event emitted");
  return;
}


async function getOSMAddr() {
  const osmAddr = await skillWalletContract.getOSMAddress();
  console.log(osmAddr);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getCommunity(tokenID) {
  const com = await skillWalletContract.getActiveCommunity(tokenID);
  console.log("[active community]", com);
}

async function test() {
    // await joinCommunity();
    await claim();
//   await getOSMAddr();
  // const tokenId = 14;

  // await getCommunity(tokenId);
  // // // const tokenId = await joinCommunity()
  // // // await claim();

  // await addPubKeyToSkillWallet(tokenId)
  // const activateRes = await validateSW(tokenId, 0);
  // await isSkillWalletActivated(tokenId)
  // console.log(
  //   '[sleep]',
  //   'waiting 10 seconds for the chainlink validation to pass',
  // )
  // await sleep(10000)
  // await isSkillWalletActivated(tokenId)

  // await getmetadata(tokenId)
  // await addDiscordID();
}

test();
