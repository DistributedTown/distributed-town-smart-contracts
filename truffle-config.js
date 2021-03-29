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
const mnemonicPhrase = 'close gesture fatal vacant time toy general horror payment visit case you'; // 12 word mnemonic
const maticKey = 'e1f46c82a85057bf8ea6c4e20e7ce2584a61954a';

module.exports = {
  networks: {
    ganachecli: {
      host: "127.0.0.1",
      port: 8545,
      network_id: 5777,
    },
    ropsten: {
      // must be a thunk, otherwise truffle commands may hang in CI
      provider: () =>
        new HDWalletProvider(
          mnemonicPhrase,
          `https://ropsten.infura.io/v3/779285194bd146b48538d269d1332f20`
        ),
      network_id: "3",
    },
    matic: {
      provider: () => new HDWalletProvider(mnemonicPhrase, `https://rpc-mumbai.matic.today`),
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
    },
    mumbai: {
      provider: () =>
        new HDWalletProvider(
          mnemonicPhrase,
          `https://rpc-mumbai.matic.today/v1/e1f46c82a85057bf8ea6c4e20e7ce2584a61954a`
        ),
      network_id: 80001, // matic testnet's id
      timeoutBlocks: 500, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
    },
  },
  // Configure your compilers
  compilers: {
    solc: {
      version: "^0.6.10",
      evmVersion: "istanbul",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
