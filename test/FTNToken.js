const FTNToken = artifacts.require('./FTNToken');

contract('FTNToken', accounts => {
    let ftnInstance;

    const _name = 'Fortune';
    const _symbol = 'FTN';
    const _decimals = 18;

    beforeEach(async function() {
        this.token = await FTNToken.new(_name, _symbol, _decimals);
    });

    describe('token attributes', () => {
        it('has the correct name', async function() {
            const name = await this.token.name();
            assert.equal(name, _name);
        });

        it('has the correct symbol', async function() {
            const symbol = await this.token.symbol();
            assert.equal(symbol, _symbol);
        });

        it('has the correct decimals', async function() {
            const decimals = await this.token.decimals();
            assert.equal(decimals, _decimals);
        });
    });
});
