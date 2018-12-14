const HDWalletProvider = require('truffle-hdwallet-provider');
const dotenv = require('dotenv');

dotenv.config();

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545,
            network_id: '*', // match all networks id
        },
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
    },
    solc: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
    },
};
