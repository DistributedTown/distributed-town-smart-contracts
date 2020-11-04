const CommunitiesRegistry = artifacts.require("CommunitiesRegistry");

module.exports = function (deployer) {
  deployer.deploy(CommunitiesRegistry);
};
