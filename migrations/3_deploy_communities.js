const CommunitiesRegistry = artifacts.require("CommunitiesRegistry");

module.exports = async function (deployer) {
  const communitiesRegistry = await CommunitiesRegistry.deployed();

  await Promise.all([
    communitiesRegistry.createCommunity(),
    communitiesRegistry.createCommunity(),
    communitiesRegistry.createCommunity(),
  ]);
};
