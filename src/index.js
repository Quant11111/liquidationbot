require("dotenv").config();
const cron = require("node-cron");
const { ethers } = require("ethers");
const { scanLiquidations } = require("./services/liquidationScanner");
const { executeLiquidation } = require("./services/liquidationExecutor");
const { logger } = require("./utils/logger");

// Initialisation du provider Ethereum
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETHEREUM_RPC_URL
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Adresse qui recevra les profits
const profitReceiver = process.env.PROFIT_RECEIVER_ADDRESS;
// Nombre maximum de liquidations par exécution
const maxLiquidations = parseInt(process.env.MAX_LIQUIDATIONS_PER_RUN) || 3;
// Seuil de profit minimum
const minProfitThreshold = ethers.utils.parseEther(
  process.env.MIN_PROFIT_THRESHOLD || "0.1"
);

// Fonction principale pour rechercher et exécuter les liquidations
async function checkAndExecuteLiquidations() {
  try {
    logger.info("Démarrage de la recherche de liquidations potentielles...");

    // Analyser toutes les opportunités de liquidation
    const liquidationOpportunities = await scanLiquidations(provider);

    // Filtrer les opportunités rentables
    const profitableLiquidations = liquidationOpportunities.filter(
      (opportunity) => opportunity.estimatedProfit.gte(minProfitThreshold)
    );

    logger.info(
      `Trouvé ${profitableLiquidations.length} liquidations potentiellement rentables`
    );

    // Trier par profit estimé (décroissant)
    const sortedLiquidations = profitableLiquidations.sort((a, b) =>
      b.estimatedProfit.sub(a.estimatedProfit)
    );

    // Exécuter jusqu'à maxLiquidations liquidations
    const liquidationsToExecute = sortedLiquidations.slice(0, maxLiquidations);

    if (liquidationsToExecute.length === 0) {
      logger.info("Aucune liquidation rentable trouvée");
      return;
    }

    // Exécuter les liquidations les plus rentables
    for (const opportunity of liquidationsToExecute) {
      logger.info(
        `Tentative de liquidation pour ${
          opportunity.account
        } avec un profit estimé de ${ethers.utils.formatEther(
          opportunity.estimatedProfit
        )} ETH`
      );
      try {
        const txResult = await executeLiquidation(
          wallet,
          opportunity,
          profitReceiver
        );
        logger.info(
          `Liquidation réussie! Hash de transaction: ${txResult.hash}`
        );
      } catch (error) {
        logger.error(`Échec de la liquidation: ${error.message}`);
      }
    }
  } catch (error) {
    logger.error(
      `Erreur lors de la vérification des liquidations: ${error.message}`
    );
  }
}

// Planifier l'exécution
const checkIntervalMinutes = process.env.CHECK_INTERVAL_MINUTES || 60;
logger.info(
  `Démarrage du bot de liquidation. Vérification toutes les ${checkIntervalMinutes} minutes`
);

cron.schedule(`*/${checkIntervalMinutes} * * * *`, async () => {
  await checkAndExecuteLiquidations();
});

// Exécuter immédiatement au démarrage
checkAndExecuteLiquidations();
