## Deployment

There are three type of networks used for development testing and relesing contract.

For development purpose can be used ganache which provides local version of Ethereum network. It's suitable only for development phrase.

For real like testing should be used Rinkeby network, which provides environment similar to production network. Before releasing contract in production it should be tested in that network.

For production should be used Frontier network, which is main public network of Ethereum.

Here is list of commands that allow to deploy contract in each of described networks.

```
1. truffle migrate --reset --network development
2. truffle migrate --reset --network rinkeby
3. truffle migrate --reset --network production
```

## Wallets

For development environment and test network should be used following wallet address `0x3397CdeF1501B1DA81e00eB9685E75B5e7DcE231`. The address can be unlocked using following mnemonic prahse.

```
before candy grit inherit soda script pledge habit crime dash moral wheat
```

For production network is used dedicated ledger wallet.

## Secret Signer

By default secret signer address is the same as owner (deployer) address. For development and testing environment it can stay the same, which is not the case of production. For production network secret signer should be changed after deployment.
