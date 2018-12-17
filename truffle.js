const HDWalletProvider = require('truffle-hdwallet-provider');
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
        // https://www.rinkeby.io/
        rinkeby: {
            provider: () => {
                return new HDWalletProvider(
                    process.env.MNEMONIC,
                    `https://rinkeby.infura.io/v3/${
                        process.env.INFURA_API_KEY
                    }`,
                );
            },
            gasPrice: 25000000000,
            network_id: 4,
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
                    `https://rinkeby.infura.io/v3/${
                        process.env.INFURA_API_KEY
                    }`,
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
