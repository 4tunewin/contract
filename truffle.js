require('babel-core/register');
require('babel-polyfill');

const PrivateKeyProvider = require('truffle-privatekey-provider');
const LedgerWalletProvider = require('truffle-ledger-provider');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        // Local development network
        // https://truffleframework.com/ganache
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*', // match all networks id
        },
        // Proof-of-authority test network.
        // https://kovan.etherscan.io/
        kovan: {
            provider: () => {
                return new PrivateKeyProvider(
                    process.env.WEB3_PRIVATE_KEY,
                    'http://kovan.4tune.win:9545',
                );
            },
            gasPrice: 25000000000,
            network_id: 42,
        },
        // Main ethereum network
        production: {
            provider: () => {
                return new LedgerWalletProvider(
                    {
                        networkId: 1,
                        path: "44'/60'/0'/0",
                        askConfirm: false,
                        accountsLength: 1,
                        accountsOffset: 0,
                    },
                    'http://frontier.4tune.win:8545',
                );
            },
            gasPrice: 25000000000,
            network_id: 1,
        },
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },
};
