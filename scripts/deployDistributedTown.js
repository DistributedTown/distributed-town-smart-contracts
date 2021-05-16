/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const DistributedTownFactory = await ethers.getContractFactory("DistributedTown");

    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0x183Aec2dBa97809269211AD43a62310A816fcd57";

    console.log("\n\n 📡 Deploying...\n");

    // const distributedTown = await DistributedTownFactory.attach('0x47D22f382ab1bfe483eAB2D7827231cAaA4FAC8B');

    // const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress]);
    const distributedTown = await DistributedTownFactory.attach('0x1feB37B1D31380e9d38da1afbf4bc4485330Ac5E');
    // await distributedTown.deployed();
    let overrides = {
        // The maximum units of gas for the transaction to use
        gasLimit: 2300000,
    };
    const projectsAddress = await distributedTown.projectsAddress();
    console.log('Projects ', projectsAddress);
   const a = await distributedTown.deployGenesisCommunities(overrides);
   console.log(a);
   const b = await a.wait();
   console.log(b);
    // await distributedTown.deployGenesisCommunity(1, overrides);
    // await distributedTown.deployGenesisCommunity(2, overrides);
    const coms = await distributedTown.getCommunities();
    console.log(coms);
    // const artMetadata =
    //     "https://hub.textile.io/ipfs/bafkreid7jtzhuedeggn5welup7iyxchpqodbyam3yfnt4ey4xwnusr3vbe";
    // const localMetadata =
    //     "https://hub.textile.io/ipfs/bafkreibglk3i7c24b2zprsd3jlkzfhxti6rubv3tkif6hu36lz42uwrfki";
    // const openSourceMetadata =
    //     "https://hub.textile.io/ipfs/bafkreick7p4yms7cmwnmfizmcl5e6cdpij4jsl2pkhk5cejn744uwnziny";

    // let tx = await distributedTown.createCommunity(openSourceMetadata, 0, overrides);
    // let txReceipt = await tx.wait();
    // let communityCreatedEvent = txReceipt.events.find(txReceiptEvent => txReceiptEvent.event === 'CommunityCreated');
    // let address = communityCreatedEvent.args[0];
    // let tokenId = communityCreatedEvent.args[1];
    // let template = communityCreatedEvent.args[2];
    // console.log('address', address);
    // console.log('tokenId', tokenId);
    // console.log('template', template);

    // await distributedTown.createCommunity(artMetadata, 1, overrides);
    // await distributedTown.createCommunity(localMetadata, 2, overrides);
    const community0 = await distributedTown.communities(0);
    const community1 = await distributedTown.communities(1);
    const community2 = await distributedTown.communities(2);
    console.log(community0);
    console.log(community1);
    console.log(community2);
    console.log(
        " 💾  Artifacts (address, abi, and args) saved to: ",
        chalk.blue("packages/hardhat/artifacts/"),
        "\n\n"
    );
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
