var Dice = artifacts.require('./Dice.sol');
var FTNToken = artifacts.require('./FTNToken.sol');

module.exports = function(deployer) {
    // Setup dice contract
    Dice.deployed().then(instance => {
        // Set secret signer and max profit
        instance.setSecretSigner(web3.eth.accounts[0]);
        instance.setMaxProfit(web3.toWei(100, 'ether'));

        // Send ether to contart address
        instance.send(web3.toWei(2, 'ether'), { from: web3.eth.accounts[0] });
    });

    // Setup FTN token contract
    FTNToken.deployed().then(instance => {
        // Mint 1 FTN to deployer address
        instance.mint(web3.eth.accounts[0], 1);
    });
};
