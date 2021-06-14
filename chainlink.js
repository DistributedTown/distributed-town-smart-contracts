const SW = '0xb32039fd111d0CD95164b7e657bD75e5D085aD52';
var ethers = require('ethers');
var abi = require('./artifacts/contracts/skillWallet/SkillWallet.sol/SkillWallet.json').abi;

function mnemonic() {
  return "close gesture fatal vacant time toy general horror payment visit case you";
}

const provider = new ethers.providers.JsonRpcProvider(
  'https://rpc-mumbai.maticvigil.com'
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


async function createSW() {
  let one_bn = ethers.BigNumber.from(1);
  let skill = [one_bn, one_bn]
  let skillSet = [skill, skill, skill];
  let tokenId = -1;
  const createTx = await contract.create(
    '0x0243Dc6b9F3420B42b140f83a4068A2247b41B61',
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


async function activateSW(tokenId) {
  const createTx = await contract.activateSkillWallet(
    tokenId,
    '7e61b836b79ed463994e6a9c6e9a92bdc4418ddfde88c9ec8adca3ea8d23ec4a'
  );

  // Wait for transaction to finish
  const registerSkillWalletTransactionResult = await createTx.wait();
  const { events } = registerSkillWalletTransactionResult;
  const registeredEvent = events.find(
    e => e.event === 'SkillWalletActivated',
  );
  if (!registeredEvent)
    throw Error('Something went wrong!');
  else {
    console.log('Skill wallet activated')
  };
}

async function validateSW(tokenId) {
  // let overrides = {
  //   // The maximum units of gas for the transaction to use
  //   gasLimit: 230000,
  // };

  const pubKey = await contract.skillWalletToPubKey(0);
  console.log(pubKey);
  const createTx = await contract.validate(
    '9266a4aa1fe3bae8eaec10aab954ba560efdd976ca850b01e956b586121dbfbf275f2bde2071071fa08ed4d7b10626510300f1dc752c4924e85743a463b900761b',
    tokenId,
    1
    // overrides
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

async function test() {
  // const tokenId = await createSW();
  // await activateSW(tokenId);

  const tokenId = 0;
  await validateSW(tokenId);

}

test();