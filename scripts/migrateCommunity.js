/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const TEMPLATE = 0;

const main = async () => {
    const distributedTownAddress = "0x351A579a3b5f35B874b20ff710A555252D25d1c9";

    const distributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const distributedTownContract = await distributedTownFactory.attach(distributedTownAddress);
    const communityAddress = await distributedTownContract.communities(TEMPLATE);
    const currentCommunity = await ethers.getContractAt("Community", communityAddress);

    console.log("Current community version at address ", communityAddress, " is ", String(await currentCommunity.version()));

    const a = await distributedTownContract.migrateCommunity(communityAddress);
    console.log(a);
    console.log(await a.wait());

    const newCommunityAddress = await distributedTownContract.communities(TEMPLATE);
    const newCommunity = await ethers.getContractAt("Community", newCommunityAddress);
    console.log("New community version at address ", newCommunityAddress, " is ", String(await newCommunity.version()));

    const mockCommunityV2 = await ethers.getContractAt("MockCommunityV2", newCommunityAddress);

    console.log("Checking new function of updated community: ", await mockCommunityV2.v2Function());
    // await distributedTownContract.deployGenesisCommunities(1, {
    //     // The maximum units of gas for the transaction to use
    //     gasLimit: 2300000
    // });
    // await distributedTownContract.deployGenesisCommunities(2, {
    //     // The maximum units of gas for the transaction to use
    //     gasLimit: 2300000
    // });

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
