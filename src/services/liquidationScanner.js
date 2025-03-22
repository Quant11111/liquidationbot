const { ethers } = require("ethers");
const { logger } = require("../utils/logger");
const { getMorphoMarkets } = require("../contracts/morphoMarkets");
const { getTokenPrices } = require("../utils/priceOracle");
const { calculateProfitAfterSwap } = require("../utils/profitCalculator");

/**
 * Analyse les positions sur tous les marchés Morpho et identifie les opportunités de liquidation
 */
async function scanLiquidations(provider) {
  try {
    logger.info("Récupération des marchés Morpho...");
    const morphoMarkets = await getMorphoMarkets(provider);

    let allOpportunities = [];

    // Récupérer les prix actuels des tokens
    const tokenPrices = await getTokenPrices();

    // Pour chaque marché, vérifier les positions sous-collatéralisées
    for (const market of morphoMarkets) {
      logger.debug(`Analyse du marché ${market.name}`);

      // Récupérer les positions à risque
      const riskPositions = await market.getPositionsAtRisk();

      // Évaluer chaque position pour déterminer la rentabilité
      for (const position of riskPositions) {
        // Calculer les détails de la liquidation
        const liquidationDetails = await calculateLiquidationDetails(
          provider,
          market,
          position,
          tokenPrices
        );

        if (liquidationDetails.liquidationPossible) {
          // Calculer le profit potentiel après swap des tokens reçus
          const estimatedProfit = await calculateProfitAfterSwap(
            liquidationDetails.collateralToReceive,
            liquidationDetails.collateralToken,
            liquidationDetails.debtToCover,
            liquidationDetails.debtToken,
            tokenPrices
          );

          // Si la liquidation est rentable, ajouter aux opportunités
          if (estimatedProfit.gt(0)) {
            allOpportunities.push({
              market: market.address,
              account: position.account,
              collateralToken: liquidationDetails.collateralToken,
              debtToken: liquidationDetails.debtToken,
              debtToCover: liquidationDetails.debtToCover,
              collateralToReceive: liquidationDetails.collateralToReceive,
              estimatedProfit: estimatedProfit,
              healthFactor: position.healthFactor,
            });
          }
        }
      }
    }

    logger.info(
      `Analyse terminée. ${allOpportunities.length} opportunités de liquidation identifiées.`
    );
    return allOpportunities;
  } catch (error) {
    logger.error(`Erreur lors de l'analyse des liquidations: ${error.message}`);
    return [];
  }
}

/**
 * Calcule les détails d'une liquidation pour une position spécifique
 */
async function calculateLiquidationDetails(
  provider,
  market,
  position,
  tokenPrices
) {
  try {
    // Récupérer les paramètres de liquidation du marché
    const liquidationParameters = await market.getLiquidationParameters();

    // Vérifier si la position est liquidable
    if (position.healthFactor.gte(liquidationParameters.liquidationThreshold)) {
      return { liquidationPossible: false };
    }

    // Calculer le montant max de dette à couvrir
    const maxDebtToCover = position.totalDebt
      .mul(liquidationParameters.closeFactor)
      .div(100);

    // Calculer le montant de collatéral à recevoir (avec bonus de liquidation)
    const liquidationBonus = liquidationParameters.liquidationBonus;
    const collateralPriceInDebtToken =
      tokenPrices[position.collateralToken.address] /
      tokenPrices[position.debtToken.address];

    const baseCollateralToReceive = maxDebtToCover
      .mul(ethers.utils.parseEther(collateralPriceInDebtToken.toString()))
      .div(ethers.constants.WeiPerEther);

    const collateralToReceive = baseCollateralToReceive
      .mul(liquidationBonus + 100)
      .div(100);

    return {
      liquidationPossible: true,
      collateralToken: position.collateralToken,
      debtToken: position.debtToken,
      debtToCover: maxDebtToCover,
      collateralToReceive: collateralToReceive,
    };
  } catch (error) {
    logger.error(
      `Erreur lors du calcul des détails de liquidation: ${error.message}`
    );
    return { liquidationPossible: false };
  }
}

module.exports = {
  scanLiquidations,
};
