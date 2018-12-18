var Dice = artifacts.require('./Dice.sol');

module.exports = async function(deployer) {
    const instance = Dice.deployed();

    // Set secret signer address
    const accounts = await instance.getAccounts();
    instance.setSecretSigner(accounts[0]);

    // Set max profit
    instance.setMaxProfit(web3.toWei(100, 'ether'));
};
