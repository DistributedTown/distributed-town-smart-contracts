const Gigs = artifacts.require("Gigs");

module.exports = function (deployer) {
  deployer.deploy(Gigs);
};
