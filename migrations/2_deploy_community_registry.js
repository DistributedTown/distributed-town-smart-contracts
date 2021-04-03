const CommunitiesRegistry = artifacts.require("CommunitiesRegistry");
module.exports = async (deployer, network, accounts) => {
  await deployer.deploy(
    CommunitiesRegistry,
    '0x646e7c1256aFC6620ABABf5b2C0efeb7Aa7E4cfC'
  );
};
