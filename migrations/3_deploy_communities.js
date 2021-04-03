const CommunitiesRegistry = artifacts.require("CommunitiesRegistry");
const Types = artifacts.require('CommonTypes');

module.exports = async function (deployer) {
  const communitiesRegistry = await CommunitiesRegistry.deployed();
  communitiesRegistry.createCommunity(
    "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice",
    0,
    0,
    'GenesisTown',
    Types.Template.Other,
    6,
    12,
    24,
    communitiesRegistry.skillWalletAddress(),
    communitiesRegistry.address
  );
};
