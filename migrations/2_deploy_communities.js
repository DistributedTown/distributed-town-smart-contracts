const Community = artifacts.require("Community");

const GSN_ROPSTEN_FORWARDER = "0x25CEd1955423BA34332Ec1B60154967750a0297D";

module.exports = function (deployer) {
  deployer.deploy(Community, GSN_ROPSTEN_FORWARDER);
  deployer.deploy(Community, GSN_ROPSTEN_FORWARDER);
  deployer.deploy(Community, GSN_ROPSTEN_FORWARDER);
};
