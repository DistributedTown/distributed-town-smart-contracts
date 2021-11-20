/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers, upgrades } = require("hardhat");
const { deploy } = require("./utils")

const NEW_VERSION = 3;

const main = async () => {
    const ditoAddress = '0x351A579a3b5f35B874b20ff710A555252D25d1c9';
    const distributedTown = await ethers.getContractAt('DistributedTown', ditoAddress);
    const currentCommunityFactory = await ethers.getContractAt("CommunityFactory", await distributedTown.communityFactoryAddress());
    console.log("Community Factory is currently version: ", String(await currentCommunityFactory.version()));

    console.log("\n\n 📡 Deploying new community factory...\n");

    const communityFactory = await deploy('MockCommunityFactoryV2', [NEW_VERSION], {});

    console.log("Setting new Community Factory...");

    const a = await distributedTown.updateCommunityFactory(communityFactory.address);
    await a.wait();

    const newCommunityFactory = await ethers.getContractAt("CommunityFactory", await distributedTown.communityFactoryAddress());

    console.log("Community Factory is now version: ", String(await newCommunityFactory.version()));
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
