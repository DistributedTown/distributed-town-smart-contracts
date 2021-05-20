/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();

    const oracle = '0x175246176F2c3FaE7dC470eF497e92bae3F30fec';
    const jobId = ethers.utils.toUtf8Bytes('695247adb7244501a14e477b164eb3a0')
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
