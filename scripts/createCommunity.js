/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const main = async () => {
    const distributedTownAddress = "0x054e86098Ed6233b8e157d09670ec3A0938AedA0";

    const distributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const distributedTownContract = await distributedTownFactory.attach(distributedTownAddress);

    const tx = await distributedTownContract.getCommunities(
    );
    console.log(tx);

    // // const txReceipt = await tx.wait();
    // // const communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'CommunityCreated');
    // // const address = communityCreatedEvent.args[0];
    // // const tokenId = communityCreatedEvent.args[1];
    // // const template = communityCreatedEvent.args[2];

    // console.log('address', address);
    // console.log('tokenId', tokenId);
    // console.log('template', template);

};


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
