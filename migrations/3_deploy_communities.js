const CommunitiesRegistry = artifacts.require("CommunitiesRegistry");

module.exports = async function (deployer) {
  const communitiesRegistry = await CommunitiesRegistry.deployed();
  await Promise.all([
    communitiesRegistry.createCommunity(1),
    // communitiesRegistry.createCommunity(2),
    // communitiesRegistry.createCommunity(3),
  ]);
};
