const request = require('superagent');
const { pricingSources } = require('./constants');
const { logger } = require('./logger');

const { create, all } = require('mathjs');

const math = create(all);

math.config({
  number: 'BigNumber',
  precision: 64
});




class PricingInterface {

  constructor(options) {
    const { source, apiKey } = options;
    this._source = source;
    this._apiKey = apiKey;
  }

  compare(coins, base) {
    return new Promise(async function(resolve) {
      try {
        const apiKey = this._apiKey;
        switch(this._source) {
          case pricingSources.COIN_MARKET_CAP: {
            const { body } = await request
              .get(`https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${coins[0]}&convert=${base}`)
              .set('X-CMC_PRO_API_KEY', apiKey);
            const { data } = body;
            resolve(Object.keys(data)
              .map(coin => {
                const { price } = body.data[coin].quote[base];
                return {
                  coin,
                  base,
                  multiplier: price
                };
              }));
            break;
          } case pricingSources.CRYPTO_COMPARE: {
            const { body } = await request
              .get(`https://min-api.cryptocompare.com/data/price?fsym=${coins[0]}&tsyms=${base}`);
            resolve([{
              coin: coins[0],
              base,
              multiplier: body[base]
            }]);
            break;
          } default:
            resolve([]);
        }
      } catch(err) {
        logger.error('PricingInterface.compare() failed with error: ' + err.message + '\n' + err.stack);
        resolve([]);
      }
    }.bind(this));
  }

}

module.exports = PricingInterface;
