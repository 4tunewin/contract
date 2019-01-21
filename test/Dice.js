const lodash = require('lodash');
const crypto = require('crypto');
const Dice = artifacts.require('./Dice.sol');

contract('Dice', accounts => {
    const dummySecretSigner = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const owner = accounts[0];
    const nextOwner = accounts[1];
    const secretSigner = accounts[1];
    const croupier = accounts[1];
    const gambler = accounts[2];

    describe('game attributes', () => {
        let diceInstance;
        beforeEach(async () => {
            diceInstance = await Dice.new();
        });

        it('has the address', () => {
            const address = diceInstance.address;
            assert.notEqual(address, '0x0', 'has contract address');
        });

        it('has the owner', async () => {
            const address = await diceInstance.owner();
            assert.equal(address, owner, 'has owner address');
        });

        it('has the correct secret signer address', async () => {
            const address = await diceInstance.secretSigner();
            assert.equal(address, dummySecretSigner, 'has signer address');
        });

        it('has the correct max profit', async () => {
            const maxProfit = await diceInstance.maxProfit();
            assert.equal(maxProfit.toNumber(), 0, 'max profit is 0 ether');
        });
    });

    describe('changes attributes', () => {
        let diceInstance;
        beforeEach(async () => {
            diceInstance = await Dice.new();
        });

        it('set secret signer address', async () => {
            await diceInstance
                .setSecretSigner(secretSigner)
                .then(() => {
                    return diceInstance.secretSigner();
                })
                .then(address => {
                    assert.equal(
                        address,
                        secretSigner,
                        'set correct secret signer address',
                    );
                });
        });

        it('change owner address', async () => {
            await diceInstance
                .approveNextOwner(nextOwner)
                .then(() => {
                    return diceInstance.owner();
                })
                .then(address => {
                    assert.equal(
                        address,
                        owner,
                        "doesn't change owner address without approvement",
                    );
                });

            await diceInstance
                .acceptNextOwner({ from: owner })
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        'ownership can be accepted only by approved user',
                    );
                });

            await diceInstance
                .acceptNextOwner({ from: nextOwner })
                .then(() => {
                    return diceInstance.owner();
                })
                .then(address => {
                    assert.equal(
                        address,
                        nextOwner,
                        'has set next owner address',
                    );
                });

            // Change original owner
            await diceInstance
                .approveNextOwner(owner, { from: nextOwner })
                .then(() => {
                    diceInstance.acceptNextOwner({ from: owner });
                });
        });

        it('change max profit', async () => {
            await diceInstance
                .setMaxProfit(1, { from: nextOwner })
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        'only owner can change max profit value',
                    );
                });

            await diceInstance
                .setMaxProfit(web3.toWei(300001, 'ether'))
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        "new profit cant't exceed max amount",
                    );
                });

            await diceInstance
                .setMaxProfit(web3.toWei(200000, 'ether'))
                .then(() => {
                    return diceInstance.maxProfit();
                })
                .then(maxProfit => {
                    assert.equal(
                        maxProfit.toNumber(),
                        web3.toWei(200000, 'ether'),
                        'has changed max profit value',
                    );
                });
        });

        it('increase jackpot', async () => {
            await diceInstance
                .increaseJackpot(web3.toWei(10, 'ether'))
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        "jackpot value can't exceed balance of the contract",
                    );
                });

            await diceInstance
                .send(web3.toWei(1, 'ether'), { from: owner })
                .then(() => {
                    return diceInstance.increaseJackpot(1);
                })
                .then(() => {
                    return diceInstance.jackpotSize();
                })
                .then(amount => {
                    assert.equal(
                        amount.toNumber(),
                        1,
                        'increase jackpot value',
                    );
                });
        });
    });

    describe('withdraw funds', () => {
        let diceInstance;
        beforeEach(async () => {
            diceInstance = await Dice.new();
        });

        it('should fail to withdraw more then current balance', async () => {
            const withdrawAddress = accounts[2];

            // Try to withdraw more then available balance
            await diceInstance
                .withdrawFunds(withdrawAddress, 1)
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        "can't withdraw more then current balance",
                    );
                });
        });

        it('should fail to withdraw amount locked in jackpot', async () => {
            // Send 1 ether on balance
            await diceInstance.send(web3.toWei(1, 'ether'), { from: owner });

            // Send 1 ether on jacpot
            await diceInstance.increaseJackpot(web3.toWei(1, 'ether'), {
                from: owner,
            });

            // Should fail withdraw because of locked jackpot
            await diceInstance
                .withdrawFunds(owner, web3.toWei(1, 'ether'))
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        "can't withdraw locked jackpot size",
                    );
                });
        });

        it('should withdraw funds correctly', async () => {
            // Send 1 ether on balance
            await diceInstance.send(web3.toWei(1, 'ether'), { from: owner });

            // Remember balance of sender
            const ownerBalanceBefore = await web3.eth.getBalance(owner);

            // Withdraw 1 ether from balance
            await diceInstance.withdrawFunds(owner, web3.toWei(1, 'ether'));

            // Make sure that contract balance is 0
            const diceBalance = await web3.eth.getBalance(diceInstance.address);
            assert.equal(
                diceBalance.toNumber(),
                0,
                'has withdrawen all available founds',
            );

            // Get current balance of sender
            const ownerBalanceAfter = await web3.eth.getBalance(owner);
            assert.isTrue(
                ownerBalanceAfter.toNumber() > ownerBalanceBefore.toNumber(),
                'funds should be returned to specified address',
            );
        });
    });

    describe('make a bet', () => {
        let diceInstance;
        const secret = 1;
        let blockHash = null;

        before(async () => {
            diceInstance = await Dice.new();

            await diceInstance.setSecretSigner(secretSigner);
            await diceInstance.setCroupier(croupier);
            await diceInstance.setMaxProfit(web3.toWei(200000, 'ether'));
        });

        it('should place a bet', async () => {
            const commitLastBlock = web3.eth.blockNumber + 200;
            const packedCommit =
                '0x' + lodash.padStart(secret.toString(16), 64, 0);
            const commit = web3.sha3(packedCommit, {
                encoding: 'hex',
            });

            const packed = [
                '0x',
                lodash.padStart(commitLastBlock.toString(16), 10, 0),
                commit.substr(2),
            ].join('');

            const hash = web3.sha3(packed, {
                encoding: 'hex',
            });

            const commitSignature = web3.eth.sign(secretSigner, hash);

            const r = '0x' + commitSignature.substr(2, 64);
            const s = '0x' + commitSignature.substr(66, 64);
            const v = parseInt(commitSignature.substr(130, 2)) + 27;

            // Send some ether to the contract
            await diceInstance.send(web3.toWei(1, 'ether'), { from: owner });

            await diceInstance
                .placeBet(1, 6, commitLastBlock, commit, v, r, s, {
                    from: gambler,
                    value: web3.toWei(0.1, 'ether'),
                })
                .then(result => {
                    blockHash = result.receipt.blockHash;

                    assert.equal(result.logs.length, 1, 'triggers one event');
                    assert.equal(
                        result.logs[0].event,
                        'BetPlaced',
                        'should be "BetPlaced" event',
                    );
                    assert.equal(
                        result.logs[0].args.gambler,
                        gambler,
                        'logs the account the bet is placed from',
                    );
                    assert.equal(
                        result.logs[0].args.amount.toNumber(),
                        web3.toWei(0.1),
                        'logs the amount placed on the bet',
                    );
                    assert.equal(
                        result.logs[0].args.betMask.toNumber(),
                        1,
                        'logs the bet mask',
                    );
                    assert.equal(
                        result.logs[0].args.modulo.toNumber(),
                        6,
                        'logs the modulo',
                    );
                });
        });

        it('settle bet', async () => {
            await diceInstance
                .settleBet(secret, blockHash, { from: croupier })
                .then(result => {
                    assert.equal(result.logs.length, 1, 'triggers one event');
                    assert.equal(
                        result.logs[0].event,
                        'Payment',
                        'should be "Payment" event',
                    );
                    assert.equal(
                        result.logs[0].args.beneficiary,
                        gambler,
                        'logs the beneficiary address the payment is transfered to',
                    );
                });
        });
    });

    describe('destroy contract', () => {
        let diceInstance;
        before(async () => {
            diceInstance = await Dice.new();
        });

        it('should fail if called not by owner', async () => {
            await diceInstance
                .kill({ from: nextOwner })
                .then(assert.fail)
                .catch(e => {
                    assert(
                        e.message.indexOf('revert') >= 0,
                        'must be owner to kill contract',
                    );
                });
        });

        it('should successfully destroy the contract', async () => {
            await diceInstance.send(web3.toWei(1, 'ether'), {
                from: owner,
            });
            const beforeOwnerBalance = await web3.eth.getBalance(owner);

            await diceInstance
                .kill({ from: owner })
                .then(() => {
                    return web3.eth.getBalance(diceInstance.address);
                })
                .then(contractBalance => {
                    assert.equal(
                        contractBalance.toNumber(),
                        0,
                        'has to withdraw all funds',
                    );
                    return web3.eth.getBalance(owner);
                })
                .then(afterOwnerBalance => {
                    assert.isTrue(
                        afterOwnerBalance.gt(beforeOwnerBalance),
                        'all funds from contract should be transfered to owner address',
                    );
                });
        });
    });

    describe('load test', () => {
        let diceInstance;
        let blockHash = 0;

        before(async () => {
            diceInstance = await Dice.new();

            await diceInstance.setSecretSigner(secretSigner);
            await diceInstance.setMaxProfit(web3.toWei(200000, 'ether'));
            await diceInstance.setCroupier(croupier);

            // Send some ether to the contract
            await diceInstance.send(web3.toWei(5, 'ether'), {
                from: owner,
            });
        });

        it('playing 100 games', async function() {
            // disable timeout
            this.timeout(0);

            for (let i = 1; i <= 100; i++) {
                console.log(`      ✓ Game ${i} out of 100`);

                const secret = '0x' + crypto.randomBytes(32).toString('hex');
                const commitLastBlock = web3.eth.blockNumber + 200;
                const commit = web3.sha3(secret, {
                    encoding: 'hex',
                });

                const packed = [
                    '0x',
                    lodash.padStart(commitLastBlock.toString(16), 10, 0),
                    commit.substr(2),
                ].join('');

                const hash = web3.sha3(packed, {
                    encoding: 'hex',
                });
                const commitSignature = web3.eth.sign(secretSigner, hash, {
                    from: secretSigner,
                });

                const r = '0x' + commitSignature.substr(2, 64);
                const s = '0x' + commitSignature.substr(66, 64);
                const v = parseInt(commitSignature.substr(130, 2)) + 27;

                await diceInstance
                    .placeBet(1, 6, commitLastBlock, commit, v, r, s, {
                        from: gambler,
                        value: web3.toWei(0.1, 'ether'),
                    })
                    .then(result => {
                        blockHash = result.receipt.blockHash;

                        assert.equal(
                            result.logs[0].event,
                            'BetPlaced',
                            'should be "BetPlaced" event',
                        );
                    });

                await diceInstance
                    .settleBet(secret, blockHash, { from: croupier })
                    .then(result => {
                        assert.equal(
                            result.logs[0].event,
                            'Payment',
                            'should be "Payment" event',
                        );
                    });
            }

            await diceInstance.lockedInBets().then(amount => {
                assert.equal(amount, 0, 'should has 0 locked bets');
            });
        });
    });
});
