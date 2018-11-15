var Dice = artifacts.require('./Dice.sol');
var FTNToken = artifacts.require('./FTNToken.sol');

module.exports = function(deployer) {
    // Deploy Dice game contract
    deployer.deploy(Dice);

    // Deploy token contract
    deployer.deploy(FTNToken, 'Fortune', 'FTN', 18);
};
