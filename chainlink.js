const SW = '0xfD516cEa651aD1ac3fa330a459e47865C947f851';
var ethers = require('ethers');
var abi = require('./artifacts/contracts/skillWallet/SkillWallet.sol/SkillWallet.json').abi;
var ditoabi = require('./artifacts/contracts/DistributedTown.sol/DistributedTown.json').abi;
var communityAbi = require('./artifacts/contracts/community/Community.sol/Community.json').abi;

function mnemonic() {
  return "close gesture fatal vacant time toy general horror payment visit case you";
}

const provider = new ethers.providers.JsonRpcProvider(
  'https://rpc-mumbai.maticvigil.com'
  // 'https://kovan.infura.io/v3/779285194bd146b48538d269d1332f20'
);

// Wallet connected to a provider
const senderWalletMnemonic = ethers.Wallet.fromMnemonic(
  mnemonic(),
  "m/44'/60'/0'/0/0"
);

let signer = senderWalletMnemonic.connect(provider);


const contract = new ethers.Contract(
  SW,
  abi,
  signer,
);

const ditoContract = new ethers.Contract(
  '0x16d8869471Ff4e0ffd4ad42755132c92eBC291Be',
  ditoabi,
  signer,
);

async function deployGenesis() {
    let overrides = {
    // The maximum units of gas for the transaction to use
    gasLimit: 230000,
  };
  const t = await ditoContract.deployGenesisCommunities(0);
  // const t = await ditoContract.deployGenesisCommunities(1);
  // const tx1 = await ditoContract.deployGenesisCommunities(2);
  console.log(t);
}

async function getCommunities() {
  const coms = await ditoContract.getCommunities();
  console.log(coms);
}


async function getDiToCreditAddr() {
  const coms = await ditoContract.getCommunities();
  const communityContract = new ethers.Contract(
    coms[0],
    communityAbi,
    signer,
  );
  const a = await communityContract.ditoCreditsAddr();
  console.log(a);
}

async function joinCommunity() {
  const coms = await ditoContract.getCommunities();
  const communityContract = new ethers.Contract(
    coms[0],
    communityAbi,
    signer,
  );
  const url = 'https://hub.textile.io/ipfs/bafkreicezefuc6einewxdqhlpefelzjponwdqt4vmp2byosq5uwpn7hgoq';

  const wei = ethers.utils.parseEther('2220').toString();
  const joinedTx = await communityContract.joinNewMember(1, 1, 2, 2, 3, 3, url, wei);
  console.log(joinedTx);
}
async function createSW() {
  let one_bn = ethers.BigNumber.from(1);
  let skill = [one_bn, one_bn]
  let skillSet = [skill, skill, skill];
  let tokenId = -1;
  const createTx = await contract.create(
    '0x2CEF62C91Dd92FC35f008D1d6Ed08EADF64306bc',
    skillSet,
    'https://some.url'
  );

  // Wait for transaction to finish
  const registerSkillWalletTransactionResult = await createTx.wait();
  const { events } = registerSkillWalletTransactionResult;
  const registeredEvent = events.find(
    e => e.event === 'SkillWalletCreated',
  );
  if (!registeredEvent)
    throw Error('Something went wrong!');
  else {
    console.log('Skill wallet created')
    tokenId = registeredEvent.args[2];
  };
  return tokenId;
}


async function addPubKeyToSkillWallet(tokenId) {
  const createTx = await contract.addPubKeyToSkillWallet(
    tokenId,
    '7e61b836b79ed463994e6a9c6e9a92bdc4418ddfde88c9ec8adca3ea8d23ec4a'
  );

  // Wait for transaction to finish
  const registerSkillWalletTransactionResult = await createTx.wait();
  const { events } = registerSkillWalletTransactionResult;
  const registeredEvent = events.find(
    e => e.event === 'PubKeyAddedToSkillWallet',
  );
  if (!registeredEvent)
    throw Error('Something went wrong!');
  else {
    console.log('Skill wallet activated')
  };
}

async function validateSW(tokenId) {
  const pubKey = await contract.skillWalletToPubKey(0);
  console.log(pubKey);
  const createTx = await contract.validate(
    '9266a4aa1fe3bae8eaec10aab954ba560efdd976ca850b01e956b586121dbfbf275f2bde2071071fa08ed4d7b10626510300f1dc752c4924e85743a463b900761b',
    tokenId,
    0,
    [],
    [],
    []
  );

  console.log(createTx);

  // Wait for transaction to finish
  const registerSkillWalletTransactionResult = await createTx.wait();
  console.log(registerSkillWalletTransactionResult);
  const { events } = registerSkillWalletTransactionResult;
  const registeredEvent = events.find(
    e => e.event === 'ValidationPassed',
  );
  if (!registeredEvent)
    throw Error('Something went wrong!');
  else {
    console.log('validation passed')
  };
}


async function isSkillWalletActivated(tokenId) {
  const isActivated = await contract.isSkillWalletActivated(tokenId);
  console.log(isActivated)
}


async function getSkillWalletIdByOwner(tokenId) {
  const isActivated = await contract.getSkillWalletIdByOwner(tokenId);
  console.log(isActivated)
}

async function ownerOf(tokenId) {
  const isActivated = await contract.ownerOf(tokenId);
  console.log(isActivated)
}

async function test() {
  // await deployGenesis();

  // const tokenId = await createSW();
  // await addPubKeyToSkillWallet(tokenId);

  const tokenId = 2;
  // await validateSW(tsokenId);
  // await getDiToCreditAddr();
  await isSkillWalletActivated(tokenId);
  await getSkillWalletIdByOwner('0x2CEF62C91Dd92FC35f008D1d6Ed08EADF64306bc');
  await ownerOf(tokenId);
}

test();