const Dice = artifacts.require('./Dice.sol');
const lodash = require('lodash');

contract('Dice', accounts => {
    const dummySecretSigner = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee';
    const owner = accounts[0];
    const nextOwner = accounts[1];
    const secretSigner = accounts[1];
    const gambler = accounts[2];

    let diceInstance;

    beforeEach(async () => {
        diceInstance = await Dice.new();
    });

    describe('token attributes', () => {
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

    // it('withdraw funds', async () => {
    //     const withdrawAddress = accounts[2];
    //     const withdrawAddressBalance = await web3.eth.getBalance(
    //         withdrawAddress,
    //     );
    //     const jackpotSize = await diceInstance.jackpotSize();

    //     // Try to withdraw more then available balance
    //     await diceInstance
    //         .withdrawFunds(withdrawAddress, web3.toWei(100))
    //         .then(assert.fail)
    //         .catch(e => {
    //             assert(
    //                 e.message.indexOf('revert') >= 0,
    //                 "can't withdraw more then current balance",
    //             );
    //         });

    //     // Increase balance and remember final amount
    //     const contractBalance = await diceInstance
    //         .send(web3.toWei(1, 'ether'), { from: owner })
    //         .then(() => {
    //             return web3.eth.getBalance(diceInstance.address);
    //         });

    //     // Should fail withdraw because of locked jackpot
    //     await diceInstance
    //         .withdrawFunds(withdrawAddress, contractBalance.toNumber())
    //         .then(assert.fail)
    //         .catch(e => {
    //             assert(
    //                 e.message.indexOf('revert') >= 0,
    //                 "can't withdraw locked jackpot size",
    //             );
    //         });

    //     // Should process withdraw correctly
    //     await diceInstance
    //         .withdrawFunds(
    //             withdrawAddress,
    //             contractBalance.toNumber() -
    //                 web3.toWei(jackpotSize.toNumber(), 'ether'),
    //         )
    //         .then(() => {
    //             return web3.eth.getBalance(diceInstance.address);
    //         })
    //         .then(amount => {
    //             assert.equal(
    //                 amount.toNumber(),
    //                 web3.toWei(jackpotSize.toNumber(), 'ether'),
    //                 'has withdraw all available founds',
    //             );
    //             return web3.eth.getBalance(withdrawAddress);
    //         })
    //         .then(amount => {
    //             const expectedBalance =
    //                 withdrawAddressBalance.toNumber() +
    //                 (contractBalance.toNumber() -
    //                     web3.toWei(jackpotSize.toNumber(), 'ether'));

    //             assert.equal(
    //                 amount.toNumber(),
    //                 expectedBalance,
    //                 'withdraw address balance has increased',
    //             );
    //         });
    // });

    // it('place bet', async () => {
    //     const commitLastBlock = web3.eth.blockNumber + 200;
    //     const packedCommit = '0x' + lodash.padStart((1).toString(16), 64, 0);
    //     const commit = web3.sha3(packedCommit, {
    //         encoding: 'hex',
    //     });

    //     const packed = [
    //         '0x',
    //         lodash.padStart(commitLastBlock.toString(16), 10, 0),
    //         commit.substr(2),
    //     ].join('');

    //     const hash = web3.sha3(packed, {
    //         encoding: 'hex',
    //     });

    //     const commitSignature = web3.eth.sign(secretSigner, hash);

    //     const r = '0x' + commitSignature.substr(2, 64);
    //     const s = '0x' + commitSignature.substr(66, 64);
    //     const v = parseInt(commitSignature.substr(130, 2)) + 27;

    //     // Send some ether to the contract
    //     await diceInstance.send(web3.toWei(3, 'ether'), { from: owner });

    //     await diceInstance
    //         .placeBet(1, 6, commitLastBlock, commit, v, r, s, {
    //             from: gambler,
    //             value: web3.toWei(0.1, 'ether'),
    //         })
    //         .then(receipt => {
    //             assert.equal(receipt.logs.length, 1, 'triggers one event');
    //             assert.equal(
    //                 receipt.logs[0].event,
    //                 'BetPlaced',
    //                 'should be "BetPlaced" event',
    //             );
    //             assert.equal(
    //                 receipt.logs[0].args.gambler,
    //                 gambler,
    //                 'logs the account the bet is placed from',
    //             );
    //             assert.equal(
    //                 receipt.logs[0].args.amount.toNumber(),
    //                 web3.toWei(0.1),
    //                 'logs the amount placed on the bet',
    //             );
    //             assert.equal(
    //                 receipt.logs[0].args.betMask.toNumber(),
    //                 1,
    //                 'logs the bet mask',
    //             );
    //             assert.equal(
    //                 receipt.logs[0].args.modulo.toNumber(),
    //                 6,
    //                 'logs the modulo',
    //             );
    //         });
    // });

    // it('settle bet', async () => {
    //     const commit = 1;
    //     await diceInstance.settleBet(commit, 0).then(receipt => {
    //         assert.equal(receipt.logs.length, 1, 'triggers one event');
    //         assert.equal(
    //             receipt.logs[0].event,
    //             'Payment',
    //             'should be "Payment" event',
    //         );
    //         assert.equal(
    //             receipt.logs[0].args.beneficiary,
    //             gambler,
    //             'logs the beneficiary address the payment is transfered to',
    //         );
    //     });
    // });

    // // it('refund bet', () => {});
    // // it('clear storage', () => {});

    // it('kill contract', async () => {
    //     await diceInstance
    //         .kill({ from: nextOwner })
    //         .then(assert.fail)
    //         .catch(e => {
    //             assert(
    //                 e.message.indexOf('revert') >= 0,
    //                 'must be owner to kill contract',
    //             );
    //         });

    //     const ownerBalance = await web3.eth.getBalance(owner);
    //     const contractBalance = await web3.eth.getBalance(diceInstance.address);

    //     diceInstance
    //         .kill({ from: owner })
    //         .then(() => {
    //             return web3.eth.getBalance(diceInstance.address);
    //         })
    //         .then(balance => {
    //             assert.equal(
    //                 balance.toNumber(),
    //                 0,
    //                 'has to withdraw all funds',
    //             );
    //             return web3.eth.getBalance(owner);
    //         })
    //         .then(balance => {
    //             assert.equal(
    //                 ownerBalance.toNumber() + contractBalance.toNumber(),
    //                 balance.toNumber(),
    //                 'all funds from contract should be transfered to owner address',
    //             );
    //         });
    // });
});
