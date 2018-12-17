var Dice = artifacts.require('./Dice.sol');

module.exports = function(deployer) {
    // Setup dice contract
    Dice.deployed().then(instance => {
        // Set secret signer and max profit
        instance.setSecretSigner(web3.eth.accounts[0]);
        instance.setMaxProfit(web3.toWei(100, 'ether'));
    });
};
