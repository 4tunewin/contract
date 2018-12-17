var Dice = artifacts.require('./Dice.sol');

module.exports = function(deployer) {
    // Deploy Dice game contract
    deployer.deploy(Dice);
};
