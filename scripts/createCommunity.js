/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const communityRegistryAddress = "0x418822929529F7A16D61FdAebF6882B8813478d0";

    //
    const communityRegistryFactory = await ethers.getContractFactory("DistributedTown");
    const communityRegistryContract = await communityRegistryFactory.attach(communityRegistryAddress);

    const tx = await communityRegistryContract.createCommunity(
        "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
        0
    );

    const txReceipt = await tx.wait();
    const communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'CommunityCreated');
    const address = communityCreatedEvent.args[0];
    const tokenId = communityCreatedEvent.args[1];
    const template = communityCreatedEvent.args[2];

    console.log('address', address);
    console.log('tokenId', tokenId);
    console.log('template', template);

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
