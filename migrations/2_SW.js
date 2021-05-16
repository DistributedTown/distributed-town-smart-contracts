const SkillWallet = artifacts.require('SkillWallet');
const DistributedTown = artifacts.require('DistributedTown');

module.exports = async (deployer, network, accounts) => {


  const oracle = '0xb5BA7f14Fe0205593255c77875348281b44DE7BF';
  const jobId = Buffer.from('246a1e4d23694d858d7d5ed1088e2199')
  
  await deployer.deploy(
    SkillWallet,
    oracle,
    jobId
  );
  console.log(SkillWallet.address);

  await deployer.deploy(
    DistributedTown, 
    "",
    SkillWallet.address
  );
  
  console.log(DistributedTownl.address)

};
