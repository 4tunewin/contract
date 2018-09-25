var Dice = artifacts.require('./Dice.sol');

module.exports = function(deployer) {
    Dice.deployed().then(instance => {
        // Set secret signer
        instance.setSecretSigner(web3.eth.accounts[0]);
        instance.setMaxProfit(web3.toWei(100, 'ether'));

        // Send ether to contart address
        instance.send(web3.toWei(2, 'ether'), { from: web3.eth.accounts[0] });
    });
};
