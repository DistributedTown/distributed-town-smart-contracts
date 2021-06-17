/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy, tenderlyVerify } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const skillWalletAddress = "0xae84b0329433a274Ae6712F5852D28B444Bb784b";

    console.log("\n\n 📡 Deploying...\n");

    
    const gigStatuses = await deploy('GigStatuses');
    await gigStatuses.deployed();

    const addressProvider = await deploy('AddressProvider', [], {},
        {
            GigStatuses: gigStatuses.address
        });
    // const addressProviderAddress = '0x0a53D8718e2BC72A23FAeED8876F80EFD14b105C';
    await addressProvider.deployed();
    const distributedTown = await deploy("DistributedTown", ['http://someurl.io', skillWalletAddress, addressProvider.address]);
    await distributedTown.deployed();
    // await tenderlyVerify({ contractName: 'DistributedTown', contractAddress: '0xF4a878dCa6c41465D79cB959fD3F90100657cFfa'} );
    // const a = await distributedTown.deployGenesisCommunities(0, {
    //     // The maximum units of gas for the transaction to use
    //     gasLimit: 2300000
    // });
    // console.log(a);

    // await distributedTown.deployGenesisCommunities(1);
    // await distributedTown.deployGenesisCommunities(2);

    // const coms = await distributedTown.getCommunities();
    // console.log(coms);

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
