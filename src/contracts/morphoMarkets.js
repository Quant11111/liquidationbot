const { ethers } = require("ethers");
const { logger } = require("../utils/logger");
const {
  getMorphoContract,
  getAccountHealthFactor,
} = require("./morphoContract");

// Seuil de liquidation pour Morpho (valeur commune: 1.0 = 100%)
const LIQUIDATION_THRESHOLD = ethers.utils.parseUnits("1", 18);

/**
 * Classe représentant un marché Morpho
 */
class MorphoMarket {
  /**
   * @param {string} address - Adresse du token du pool
   * @param {string} name - Nom du marché
   * @param {ethers.Contract} morphoContract - Instance du contrat Morpho
   * @param {Object} parameters - Paramètres du marché
   * @param {ethers.providers.Provider} provider - Provider Ethereum
   */
  constructor(address, name, morphoContract, parameters, provider) {
    this.address = address;
    this.name = name;
    this.morphoContract = morphoContract;
    this.parameters = parameters;
    this.provider = provider;
  }

  /**
   * Récupère les positions à risque de liquidation
   * @returns {Promise<Array>} - Liste des positions à risque
   */
  async getPositionsAtRisk() {
    try {
      logger.debug(
        `Recherche des positions à risque sur le marché ${this.name}`
      );

      // Dans une implémentation réelle, nous récupérerions ces données depuis un indexeur
      // ou en écoutant les événements passés. Pour cet exemple, nous simulons des résultats

      // Simuler 3 positions à risque avec des facteurs de santé différents
      const riskAccounts = [
        {
          account: "0x1234567890123456789012345678901234567890",
          healthFactor: ethers.utils.parseUnits("0.95", 18),
          collateralToken: {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            symbol: "WETH",
            decimals: 18,
          },
          debtToken: {
            address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
            symbol: "DAI",
            decimals: 18,
          },
          totalDebt: ethers.utils.parseUnits("5000", 18),
          totalCollateral: ethers.utils.parseUnits("3", 18),
        },
        {
          account: "0x2345678901234567890123456789012345678901",
          healthFactor: ethers.utils.parseUnits("0.97", 18),
          collateralToken: {
            address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", // WBTC
            symbol: "WBTC",
            decimals: 8,
          },
          debtToken: {
            address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // USDC
            symbol: "USDC",
            decimals: 6,
          },
          totalDebt: ethers.utils.parseUnits("10000", 6),
          totalCollateral: ethers.utils.parseUnits("0.3", 8),
        },
        {
          account: "0x3456789012345678901234567890123456789012",
          healthFactor: ethers.utils.parseUnits("0.9", 18),
          collateralToken: {
            address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", // WETH
            symbol: "WETH",
            decimals: 18,
          },
          debtToken: {
            address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
            symbol: "USDT",
            decimals: 6,
          },
          totalDebt: ethers.utils.parseUnits("8000", 6),
          totalCollateral: ethers.utils.parseUnits("4", 18),
        },
      ];

      logger.debug(
        `Trouvé ${riskAccounts.length} comptes à risque sur le marché ${this.name}`
      );
      return riskAccounts;
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération des positions à risque: ${error.message}`
      );
      return [];
    }
  }

  /**
   * Récupère les paramètres de liquidation du marché
   * @returns {Promise<Object>} - Paramètres de liquidation
   */
  async getLiquidationParameters() {
    try {
      // Dans une implémentation réelle, ces paramètres seraient récupérés depuis le contrat
      // Pour cet exemple, nous utilisons des valeurs typiques
      return {
        liquidationThreshold: LIQUIDATION_THRESHOLD,
        closeFactor: 50, // 50% de la dette peut être liquidée en une fois
        liquidationBonus: 8, // 8% de bonus pour le liquidateur
      };
    } catch (error) {
      logger.error(
        `Erreur lors de la récupération des paramètres de liquidation: ${error.message}`
      );
      throw error;
    }
  }
}

/**
 * Récupère tous les marchés Morpho
 * @param {ethers.providers.Provider} provider - Provider Ethereum
 * @returns {Promise<Array<MorphoMarket>>} - Liste des marchés Morpho
 */
async function getMorphoMarkets(provider) {
  try {
    const morphoContract = await getMorphoContract(provider);

    // Dans une implémentation réelle, nous récupérerions cette liste depuis le contrat ou une API
    // Pour cet exemple, nous définissons manuellement quelques marchés

    const markets = [
      {
        address: "0xB5FE3D9C500eA67E4028dB19e9e8a42DF3A3A5e5",
        name: "Morpho-Aave v2 WETH",
      },
      {
        address: "0x9A56F30fF04884Ab7F539378e3B3AAe8A2F27f50",
        name: "Morpho-Aave v2 USDC",
      },
      {
        address: "0xEF5699654Db9bdd8F3b4cF46499A2ce36B21e34b",
        name: "Morpho-Compound DAI",
      },
      {
        address: "0x2E4B70D0eF83D551cB87dC40e2Be97aA14F3fDc5",
        name: "Morpho-Compound USDT",
      },
    ];

    // Créer des instances de MorphoMarket pour chaque marché
    const morphoMarkets = markets.map((market) => {
      // Simuler des paramètres pour chaque marché
      const parameters = {
        collateralFactor: ethers.utils.parseUnits("0.8", 18),
        borrowFactor: ethers.utils.parseUnits("0.9", 18),
        liquidationThreshold: ethers.utils.parseUnits("0.85", 18),
      };

      return new MorphoMarket(
        market.address,
        market.name,
        morphoContract,
        parameters,
        provider
      );
    });

    logger.info(`Récupéré ${morphoMarkets.length} marchés Morpho`);
    return morphoMarkets;
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération des marchés Morpho: ${error.message}`
    );
    return [];
  }
}

module.exports = {
  getMorphoMarkets,
  MorphoMarket,
};
