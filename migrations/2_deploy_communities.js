const Community = artifacts.require("Community");

module.exports = function (deployer) {
  deployer.deploy(Community);
  deployer.deploy(Community);
  deployer.deploy(Community);
};
