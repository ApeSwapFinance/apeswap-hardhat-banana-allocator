import hre from 'hardhat'
import '@nomicfoundation/hardhat-chai-matchers'
import { ethers, upgrades } from 'hardhat'
import { getDeployConfig, convertAddressesToExplorerLinks } from '../deploy-config'

/**
 * // NOTE: This is an example of the default hardhat deployment approach.
 * This project takes deployments one step further by assigning each deployment
 * its own task in ../tasks/ organized by date.
 */
async function main() {
  const accounts = await ethers.getSigners()
  const network = hre.network.name
  let { masterApe, bananaAddress, anyBanana, anyswapRouter, adminAddress, explorerLink } = getDeployConfig(network, accounts)

  const BananaAllocator = await ethers.getContractFactory('BananaAllocator')

  //BNB TESTNET
  const bananaRoutes = [
    {
      farmPid: 7,
      farmToken: '0x30E74ceFD298990880758E20223f03129F52E699',
      toAddress: '0x5c7C7246bD8a18DF5f6Ee422f9F8CCDF716A6aD2',
      actionId: 0,
      chainId: 0,
      minimumBanana: 0,
    },
  ]
  //  NOTE: To add routes during deployment
  // const bananaAllocator = await BananaAllocator.at(BananaAllocator.address);
  // bananaRoutes.forEach(async (route) => {
  //   await bananaAllocator.addBananaRoute(route.name, route.farmPid, route.farmToken, route.toAddress, route.actionId, route.chainId, route.minimumBanana);
  // })

  const allocator = await upgrades.deployProxy(BananaAllocator, [masterApe, bananaAddress, anyBanana, anyswapRouter])
  await allocator.deployed()

  await allocator.transferOwnership(adminAddress);

  const [currentOwner, currentAnyBanana, currentAnySwapRouter, currentMasterApe] = await Promise.all([
    allocator.owner(),
    allocator.anyBanana(),
    allocator.anyswapRouter(),
    allocator.masterApe(),
  ])
    
  const output = { allocator: allocator.address, currentOwner, currentAnyBanana, currentAnySwapRouter, currentMasterApe }
  console.dir(convertAddressesToExplorerLinks(output, explorerLink, true), { depth: null })
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
