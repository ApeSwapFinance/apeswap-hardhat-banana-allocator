type LinkAddress = (address: string) => string

interface NetworkConfig {
  adminAddress: string
  apeRouterAddress: string
  masterApe: string
  bananaAddress: string
  anyBanana: string
  anyswapRouter: string
  explorerLink: LinkAddress
  gnosisLink: LinkAddress
}

/**
 * Pass in Truffle migration arguments to obtain deployment arguments for specific networks.
 *
 * @param {*} network Network passed in Truffle migrations script
 * @param {*} accounts Accounts passed in Truffle migrations script
 * @returns
 */
export function getDeployConfig(network: string, accounts: { address: string }[]): NetworkConfig {
  if (['bsc', 'bsc-fork'].includes(network)) {
    console.log(`Deploying with BSC MAINNET config.`)
    return {
      adminAddress: '0x',
      apeRouterAddress: '0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7',
      masterApe: '0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9',
      bananaAddress: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
      anyBanana: '0xb52da8102e715d5E220aaE2eF58E9F978fCdEB3F',
      anyswapRouter: '0xABd380327Fe66724FFDa91A87c772FB8D00bE488',
      // keeperMaximizerVaultApeAddress: '', // NOTE: Used to deploy single strategies
      explorerLink: (address) => `https://bscscan.com/address/${address}`,
      gnosisLink: (address) => `https://gnosis-safe.io/app/bnb:${address}/home`,
    }
  } else if (['bscTestnet', 'bscTestnet-fork'].includes(network)) {
    console.log(`Deploying with BSC testnet config.`)
    return {
      adminAddress: '0x',
      apeRouterAddress: '0x3380aE82e39E42Ca34EbEd69aF67fAa0683Bb5c1',
      masterApe: '0x35C57A4646Ee69fFD571Ed84140Ab490740255FD',
      bananaAddress: '0xeccef280ff6c5f6556456e5a6ccd3450f1c57867',
      anyBanana: '0xb52da8102e715d5E220aaE2eF58E9F978fCdEB3F',
      anyswapRouter: '0xABd380327Fe66724FFDa91A87c772FB8D00bE488',
      // keeperMaximizerVaultApeAddress: '0x88acDdae93F3624B96c82A49A0655c1959c8E1cb', // NOTE: Used to deploy single strategies
      explorerLink: (address) => `https://testnet.bscscan.com/address/${address}`,
      gnosisLink: (address) => address, // Gnosis not supported for this network
    }
  } else if (['polygon', 'polygon-fork'].includes(network)) {
    console.log(`Deploying with POLYGON MAINNET config.`)
    return {
      adminAddress: '0x',
      apeRouterAddress: '0x',
      masterApe: '0x',
      bananaAddress: '0x',
      anyBanana: '0x',
      anyswapRouter: '0x',
      explorerLink: (address) => `https://polygonscan.com/address/${address}`,
      gnosisLink: (address) => `https://gnosis-safe.io/app/matic:${address}/home`,
    }
  } else if (['polygonTestnet', 'polygonTestnet-fork'].includes(network)) {
    console.log(`Deploying with POLYGON testnet config.`)
    return {
      adminAddress: '0x',
      apeRouterAddress: '0x',
      masterApe: '0x',
      bananaAddress: '0x',
      anyBanana: '0x',
      anyswapRouter: '0x',
      explorerLink: (address) => `https://mumbai.polygonscan.com/address/${address}`,
      gnosisLink: (address) => address, // Gnosis not supported for this network
    }
  } else if (['localhost', 'hardhat'].includes(network)) {
    console.log(`Deploying with localhost config.`)
    return {
      adminAddress: '0x',
      apeRouterAddress: '0x',
      masterApe: '0x',
      bananaAddress: '0x',
      anyBanana: '0x',
      anyswapRouter: '0x',
      // keeperMaximizerVaultApeAddress: '', // NOTE: Used to deploy single strategies
      explorerLink: (address) => address, // Explorer not supported for this network
      gnosisLink: (address) => address, // Gnosis not supported for this network
    }
  } else {
    throw new Error(`No config found for network ${network}.`)
  }
}

/**
 * Iterates through an object and converts any address strings to block explorer links passed
 *
 * @param {Object<any>} addressObject Object to iterate through looking for possible addresses to convert
 * @param {(address: string) => string} getLink Function which takes an address and converts to an explorer link
 * @param {boolean} detailedInfo If `true` will instead turn an address string into an object {address: string, explorer: string}
 * @returns parsedAddressObject
 */
export function convertAddressesToExplorerLinks(
  addressObject: Record<string, any>,
  getLink: LinkAddress,
  detailedInfo = false
) {
  // Using an internal function to allow for deep copying before
  function _convertAddressesToExplorerLinks(
    _addressObject: Record<string, any>,
    _getLink: LinkAddress,
    _detailedInfo = false
  ) {
    Object.keys(_addressObject).forEach((key) => {
      const value = _addressObject[key]
      if (typeof value === 'object' && value !== null) {
        _convertAddressesToExplorerLinks(value, _getLink, _detailedInfo)
      } else if (typeof value === 'string') {
        // Check if value is an address
        if (value.length === 42 && value.slice(0, 2) === '0x') {
          if (_detailedInfo) {
            _addressObject[key] = {
              address: value,
              explorer: _getLink(value),
            }
          } else {
            _addressObject[key] = _getLink(value)
          }
        }
      }
    })
    return _addressObject
  }
  const addrObjDeepCopy = JSON.parse(JSON.stringify(addressObject))
  return _convertAddressesToExplorerLinks(addrObjDeepCopy, getLink, detailedInfo)
}
