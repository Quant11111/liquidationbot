const axios = require("axios");
const { logger } = require("./logger");

/**
 * Récupère les prix actuels des tokens depuis une API
 * @returns {Promise<Object>} - Prix des tokens indexés par adresse
 */
async function getTokenPrices() {
  try {
    // Utiliser CoinGecko API pour obtenir les prix des tokens
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: "ethereum,dai,usdc,usdt,wbtc,aave,comp",
          vs_currencies: "usd",
        },
      }
    );

    // Transformer la réponse en format plus facile à utiliser
    const prices = {};

    // Adresses Ethereum mainnet des tokens communs
    const tokenAddresses = {
      ethereum: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
      dai: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      usdt: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      wbtc: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      aave: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
      comp: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
    };

    // Mapper les prix aux adresses
    for (const [coinId, price] of Object.entries(response.data)) {
      const address = tokenAddresses[coinId];
      if (address) {
        prices[address] = price.usd;
      }
    }

    // Ajouter ETH comme référence
    prices["ETH"] = response.data.ethereum.usd;

    logger.debug(`Prix des tokens récupérés: ${JSON.stringify(prices)}`);
    return prices;
  } catch (error) {
    logger.error(`Erreur lors de la récupération des prix: ${error.message}`);

    // Retourner des prix par défaut en cas d'erreur pour éviter de bloquer le processus
    return {
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2": 1800, // WETH
      "0x6B175474E89094C44Da98b954EedeAC495271d0F": 1, // DAI
      "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48": 1, // USDC
      "0xdAC17F958D2ee523a2206206994597C13D831ec7": 1, // USDT
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599": 27000, // WBTC
      ETH: 1800,
    };
  }
}

module.exports = {
  getTokenPrices,
};
