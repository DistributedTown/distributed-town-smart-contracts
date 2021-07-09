/* eslint no-use-before-define: "warn" */
const { ethers } = require("hardhat");

const main = async () => {
    const distributedTownAddress = "0xB9e653Ef004D0f3577f1373a124bADfbA487Ce2A";

    const distributedTownFactory = await ethers.getContractFactory("DistributedTown");
    const distributedTownContract = await distributedTownFactory.attach(distributedTownAddress);

    const a = await distributedTownContract.deployGenesisCommunities(0);
    console.log(a);
    console.log(await a.wait());
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
