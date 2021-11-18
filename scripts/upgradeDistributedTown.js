const { ethers, upgrades } = require('hardhat');

async function main () {

  //const distributedTownProxyAddress = '0x2d5F9858a1656163327908D623cfe1255fd589Fa';
  const distributedTownProxyAddress = '0x351A579a3b5f35B874b20ff710A555252D25d1c9';


  const DistributedTown = await ethers.getContractFactory('DistributedTown');

  console.log('Upgrading DistributedTown...');
  await upgrades.upgradeProxy(distributedTownProxyAddress, DistributedTown, {
    initializer: 'initialize'
});
  console.log('DistributedTown upgraded');
}


main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
