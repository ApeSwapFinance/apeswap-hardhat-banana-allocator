import { expect } from 'chai'
import { farmV2, utils } from '@ape.swap/hardhat-test-helpers'
import { mine, time, loadFixture } from '@nomicfoundation/hardhat-network-helpers'
import '@nomicfoundation/hardhat-chai-matchers'
import { ethers } from 'hardhat'

const ether = utils.ether

describe('BananaAllocator', function () {
  async function deployMasterApeV2_BananaAllocator() {
    const bananaAllocator__factory = await ethers.getContractFactory('BananaAllocator')
    const ERC20Mintable__factory = await ethers.getContractFactory('ERC20Mintable')

    const [owner, feeTo, mover, notMover, ghost1location, ghost2location, ghost3location] = await ethers.getSigners()

    const { bananaToken, masterApeV2 } = await farmV2.deployMockFarmV2(ethers, [owner, feeTo], {
      initialMint: '0' + '000000000000000000',
    })

    const allocator = await bananaAllocator__factory.deploy()
    await allocator
      .connect(owner)
      .initialize(
        masterApeV2.address,
        bananaToken.address,
        '0xb52da8102e715d5E220aaE2eF58E9F978fCdEB3F',
        '0xABd380327Fe66724FFDa91A87c772FB8D00bE488'
      )

    const ghost1 = await ERC20Mintable__factory.deploy('Ghost1', 'G1')
    await ghost1.mint(allocator.address, ether('1'))
    const ghost2 = await ERC20Mintable__factory.deploy('Ghost2', 'G2')
    await ghost2.mint(allocator.address, ether('1'))
    const ghost3 = await ERC20Mintable__factory.deploy('Ghost3 revert', 'G3')
    await ghost3.mint(allocator.address, ether('1'))

    const bananaPerBlockPerFarm = Number('1' + '000000000000000000') / 4
    await farmV2.addPoolsToFarm([owner], masterApeV2, [ghost1, ghost2, ghost3])
    await allocator.connect(owner).addBananaRoute(1, ghost1location.address, 0, 0, 0)
    await allocator.connect(owner).addBananaRoute(2, ghost2location.address, 0, 0, 0)
    await allocator.connect(owner).addBananaRoute(3, ghost3location.address, 0, 0, ether('987654321'))
    await allocator.connect(owner).grantMoverRole([mover.address])

    return {
      bananaToken,
      masterApeV2,
      allocator,
      bananaPerBlockPerFarm,
      accounts: { owner, mover, notMover },
      ghost1,
      ghost1location: ghost1location.address,
      ghost2,
      ghost2location: ghost2location.address,
      ghost3,
      ghost3location: ghost3location.address,
    }
  }

  it('Should stake and unstake from farm', async () => {
    console.log('test')
    const {
      bananaToken,
      masterApeV2,
      allocator,
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)
    const userInfo = await masterApeV2.userInfo(1, allocator.address)
    expect(userInfo.amount.toString()).eq(ether('1').toString())

    await allocator.unstakeFarm(1)
    const balance = await ghost1.balanceOf(allocator.address)
    expect(balance.toString()).eq(ether('1').toString())
  })

  it('Should move banana by pid', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { mover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)

    await mine(1)

    const pendingRewards = await masterApeV2.pendingBanana(1, allocator.address)
    await allocator.connect(mover).moveBananaPid(1)

    const balance = await bananaToken.balanceOf(ghost1location)
    expect(Number(balance)).gt(Number(pendingRewards))
  })

  it('Should move banana by index', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { mover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)

    await mine(1)

    const pendingRewards = await masterApeV2.pendingBanana(1, allocator.address)
    await allocator.connect(mover).moveBananaIndex(0)

    const balance = await bananaToken.balanceOf(ghost1location)
    expect(Number(balance)).gt(Number(pendingRewards))
  })

  it('Should move banana multiple farms', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { mover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)
    await allocator.stakeFarm(2)
    await allocator.stakeFarm(3)

    await mine(1)

    const pendingRewards1 = await masterApeV2.pendingBanana(1, allocator.address)
    const pendingRewards2 = await masterApeV2.pendingBanana(2, allocator.address)
    await allocator.connect(mover).moveBananaPids([1, 2, 3], false)

    const balance1 = await bananaToken.balanceOf(ghost1location)
    const balance2 = await bananaToken.balanceOf(ghost2location)
    const balance3 = await bananaToken.balanceOf(ghost3location)
    expect(Number(balance1)).gt(Number(pendingRewards1))
    expect(Number(balance2)).gt(Number(pendingRewards2))
    expect(Number(balance3)).eq(0)
  })

  it('Should move banana all farms', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { mover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)
    await allocator.stakeFarm(2)
    await allocator.stakeFarm(3)

    await mine(1)

    const pendingRewards1 = await masterApeV2.pendingBanana(1, allocator.address)
    const pendingRewards2 = await masterApeV2.pendingBanana(2, allocator.address)
    await allocator.connect(mover).moveBananaAll(false)

    const balance1 = await bananaToken.balanceOf(ghost1location)
    const balance2 = await bananaToken.balanceOf(ghost2location)
    const balance3 = await bananaToken.balanceOf(ghost3location)
    expect(Number(balance1)).gt(Number(pendingRewards1))
    expect(Number(balance2)).gt(Number(pendingRewards2))
    expect(Number(balance3)).eq(0)
  })

  it('Should revert when not enough rewards', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { mover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.stakeFarm(1)
    await allocator.stakeFarm(2)
    await allocator.stakeFarm(3)

    await mine(1)

    await expect(allocator.connect(mover).moveBananaPids([1, 2, 3], true)).to.be.revertedWith(
      'BananaAllocator: not enough rewards'
    )
    await expect(allocator.connect(mover).moveBananaAll(true)).to.be.revertedWith('BananaAllocator: not enough rewards')
  })

  it('Should change banana minimum', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { owner },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.connect(owner).changeMinimumBanana(1, '12321')
    const info = await allocator.getBananaRouteFromPid(1)
    expect(info.minimumBanana.toString()).eq('12321')
  })

  it('Should remove banana path by pid', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { owner },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)
    await allocator.connect(owner).removeBananaRoutePid(1)
    const length = await allocator.bananaRoutesLength()
    expect(length.toString()).eq('2')
  })

  it('Should(onlyRoleOrOpenRole) allow any address to move when address(0) has MOVER_ROLE', async () => {
    const {
      bananaToken,
      masterApeV2,
      allocator,
      accounts: { owner, notMover },
      ghost1,
      bananaPerBlockPerFarm,
      ghost1location,
      ghost2,
      ghost2location,
      ghost3,
      ghost3location,
    } = await loadFixture(deployMasterApeV2_BananaAllocator)

    const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

    await allocator.connect(owner).stakeFarm(1)
    await allocator.connect(owner).grantMoverRole([ZERO_ADDRESS])

    await time.increase(1)

    const pendingRewards = await masterApeV2.pendingBanana(1, allocator.address)
    await allocator.connect(notMover).moveBananaPid(1)

    const balance = await bananaToken.balanceOf(ghost1location)
    expect(Number(balance)).gt(Number(pendingRewards))

    await allocator.connect(owner).revokeMoverRole([ZERO_ADDRESS])
    await expect(allocator.connect(notMover).moveBananaAll(false)).to.be.revertedWith(
      `AccessControl: account ${notMover.address.toLowerCase()} is missing role 0xe5ed70e23144309ce456cb48bf5e6d0d8e160f094a6d65ecf1d5b03cf292d8e6`
    )
  })
})
