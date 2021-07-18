# DistributedTown SmartContracts

## Install

`yarn install`

## Local deployment

Make sure `defaultNetwork` in hardhat.config.js (on line 24) is set to `localhost`.

Terminal 1#:

`yarn chain`

Terminal #2:

1. Change the value of the `skillWalletAddress` variable in `scripts/deployDistributedTown.js`

2. Run `yarn deployCommunityRegistry`

## Matic testnet deployment

Run: `yarn generate` and `yarn account` to generate and verify account first.

Make sure `defaultNetwork` in hardhat.config.js (on line 24) is set to `maticTestnet`.

Terminal #1:

1. Change the value of the `skillWalletAddress` variable in `scripts/deployCommunityRegistry.js` (line 9)
2. Run `yarn deployCommunityRegistry`

3. Change the value of the `communityRegistryAddress` variable in `scripts/dcreateCommunity.js` (line 7)
4. Run `yarn createCommunity`

5. Run `yarn deployGigsRegistry`


Kovan DistributedTown.sol - 0xF21ebA9A57f09c24fcA9A9BDBB0E83dFFF261C0E
using SW  - 0x7426575fa17c319ca85591a1211E5574f49694aB