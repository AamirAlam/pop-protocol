async function fetchPriceFromCoinGecko(tokenId) {
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?id=${tokenId}&vs_currencies=usd&include_market_cap=false&include_24hr_vol=false&include_24hr_change=false&include_last_updated_at=false`
    );

    console.log("price fetch res", res.data);
    const priceUsd = res?.data?.[tokenId]?.usd || 0;
    return priceUsd;
    // return res?.data;
  } catch (error) {
    console.log("getCoinPrice: error", error);
    return null;
  }
}

module.exports = { fetchPriceFromCoinGecko };
