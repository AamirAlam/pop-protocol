const { default: BigNumber } = require("bignumber.js");

function BN(value=0)  {
  return new BigNumber(!value ? '0' : value);
}

function fromWei(tokens, decimals = 18) {
  try {
    if (!tokens) {
      return BN(0);
    }

    return BN(tokens)
      .div(BN(10).exponentiatedBy(decimals))
      .toString();
  } catch (error) {
    console.log("exeption in fromWei ", error);
    return BN(0);
  }
}

function toWei(tokens, decimals = 18) {
  try {
    if (!tokens) {
      return BN(0)
    }
    return BN(tokens)
      .multipliedBy(BN(10).exponentiatedBy(decimals))
      .toFixed(0)
      .toString();
  } catch (error) {
    console.log("exeption in toWei , ", error);
    return null;
  }
}

module.exports = { fromWei, toWei, BN };
