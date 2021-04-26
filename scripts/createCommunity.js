/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const communityRegistryAddress = "0x32B2B4B7d6f1a93E959a0355Ae6BDB6CC1E9465c";

    //
    const communityRegistryFactory = await ethers.getContractFactory("CommunitiesRegistry");
    const communityRegistryContract = await communityRegistryFactory.attach(communityRegistryAddress);

    const community = await communityRegistryContract.createCommunity(
        "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
        0,
        0,
        'GenesisTown',
        3,
        6,
        12,
        24
    );

    console.log("Community created", community);

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });