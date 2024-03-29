/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const TEMPLATE = 2;
const CHECK_V2 = true;

const main = async () => {
    //const distributedTownAddress = "0xB9e653Ef004D0f3577f1373a124bADfbA487Ce2A";
    const distributedTownAddress = "0x351A579a3b5f35B874b20ff710A555252D25d1c9";

    const distributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const distributedTownContract = await distributedTownFactory.attach(distributedTownAddress);

    const a = await distributedTownContract.deployGenesisCommunities(TEMPLATE);
    console.log(a);
    console.log(await a.wait());

    const newCommunityAddress = await distributedTownContract.communities(TEMPLATE);
    const newCommunity = await ethers.getContractAt("Community", newCommunityAddress);
    console.log("Deployed community: address ", newCommunityAddress, ", version ", String(await newCommunity.version()));

    if(CHECK_V2) {
        const mockCommunityV2 = await ethers.getContractAt("MockCommunityV2", newCommunityAddress);

        console.log("Checking new function of updated community: ", await mockCommunityV2.v2Function());
    }
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
