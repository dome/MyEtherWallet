import { getLatestPrices, getOwnersERC20Tokens } from './tokens.graphql';
import ethImg from '@/assets/images/networks/eth.svg';
import { Toast, ERROR } from '@/modules/toast/handler/handlerToast';
import BigNumber from 'bignumber.js';

const ETH_ID = 'ethereum';
export default class Tokenslist {
  constructor(apollo) {
    this.apollo = apollo;
  }
  getLatestPrices() {
    return this.apollo
      .query({
        query: getLatestPrices
      })
      .then(response => {
        this.tokensData = new Map();
        if (response && response.data) {
          response.data.getLatestPrices.forEach(token => {
            if (token.id === ETH_ID || token.contract) {
              this.tokensData.set(
                token.contract ? token.contract.toLowerCase() : ETH_ID,
                token
              );
            }
          });
        }
        return this.tokensData;
      })
      .catch(error => {
        return Toast(error.message, {}, ERROR);
      });
  }
  getOwnersERC20Tokens(hash) {
    return new Promise(resolve => {
      this.getLatestPrices().then(() => {
        this.apollo
          .query({
            query: getOwnersERC20Tokens,
            variables: {
              hash: hash
            }
          })
          .then(response => {
            if (response && response.data) {
              resolve(
                this.formatOwnersERC20Tokens(
                  response.data.getOwnersERC20Tokens.owners
                )
              );
            }
          })
          .catch(error => {
            return Toast(error.message, {}, ERROR);
          });
      });
    });
  }
  formatOwnersERC20Tokens(tokens) {
    const formattedList = [];
    tokens.forEach(token => {
      let foundToken;
      if (this.tokensData) {
        foundToken = this.tokensData.get(
          token.tokenInfo.contract.toLowerCase()
        );
      }

      const denominator = new BigNumber(10).pow(token.tokenInfo.decimals);
      const usdBalance = foundToken
        ? new BigNumber(token.balance)
            .div(denominator)
            .times(foundToken.current_price)
            .toString()
        : null;
      const price = foundToken ? foundToken.current_price : null;
      // need to eventually change image to check tokens network rather than just use eth network (if theres no image from coingecko)
      formattedList.push({
        name: token.tokenInfo.symbol,
        symbol: token.tokenInfo.symbol,
        subtext: token.tokenInfo.name,
        value: token.tokenInfo.name,
        balance: token.balance,
        contract: token.tokenInfo.contract,
        img: foundToken ? foundToken.image : ethImg,
        decimals: token.tokenInfo.decimals,
        market_cap: foundToken ? foundToken.market_cap : null,
        price_change_24h: foundToken ? foundToken.price_change_24h : null,
        usdBalance: usdBalance,
        price: price
      });
    });

    return formattedList;
  }
}