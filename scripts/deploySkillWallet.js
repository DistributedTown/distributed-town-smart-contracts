/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();

    const oracle = '0xb5BA7f14Fe0205593255c77875348281b44DE7BF';
    const jobId = ethers.utils.toUtf8Bytes('55d24f869f804405a4bfaff02fd52e5f')
    const skillWallet = await deploy("SkillWallet", [oracle, jobId]);


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
