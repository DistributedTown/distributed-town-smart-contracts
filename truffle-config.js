/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation and testing. Uncomment the ones you need or modify
 * them to suit your project as necessary.
 *
 * More information about configuration can be found at:
 *
 * truffleframework.com/docs/advanced/configuration
 *
 * To deploy via Infura you'll need a wallet provider (like truffle-hdwallet-provider)
 * to sign your transactions before they're sent to a remote public node. Infura accounts
 * are available for free at: infura.io/register.
 *
 * You'll also need a mnemonic - the twelve word phrase the wallet uses to generate
 * public/private key pairs. If you're publishing your code to GitHub make sure you load this
 * phrase from a file you've .gitignored so it doesn't accidentally become public.
 *
 */

require("dotenv").config();

const PrivateKeyProvider = require("truffle-privatekey-provider");
const HDWalletProvider = require("@truffle/hdwallet-provider");

const privateKey = process.env.PRIVKEY_1; // Public Key: 0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826
const privateKey2 = process.env.PRIVKEY_2; // Public Add: 0x7986b3DF570230288501EEa3D890bd66948C9B79
const mnemonicPhrase = process.env.MNEMONIC; // 12 word mnemonic

module.exports = {
  networks: {
    ganachecli: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 5777,
    },
    regtest: {
      provider: new PrivateKeyProvider(privateKey, "http://127.0.0.1:4444"),
      host: "127.0.0.1",
      port: 4444,
      network_id: 33,
    },
    regtestAccountTwo: {
      provider: new PrivateKeyProvider(privateKey2, "http://127.0.0.1:4444"),
      host: "127.0.0.1",
      port: 4444,
      network_id: 33,
    },
    ropsten: {
      // must be a thunk, otherwise truffle commands may hang in CI
      provider: () =>
        new HDWalletProvider({
          mnemonic: mnemonicPhrase,
          providerOrUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
          addressIndex: 0,
        }),
      network_id: "3",
    },
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "^0.6.10",
      evmVersion: "istanbul",
    },
  },
};
