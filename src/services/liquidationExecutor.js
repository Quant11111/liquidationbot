const { ethers } = require("ethers");
const { logger } = require("../utils/logger");
const { getFlashloanProvider } = require("../contracts/flashloanProvider");
const { getMorphoContract } = require("../contracts/morphoContract");
const { getERC20Contract } = require("../contracts/erc20Contract");
const { getGasPrice } = require("../utils/gasPrice");

/**
 * Exécute une liquidation en utilisant un flashloan
 * @param {ethers.Wallet} wallet - Le wallet qui effectue la transaction
 * @param {Object} opportunity - L'opportunité de liquidation
 * @param {string} profitReceiver - L'adresse qui recevra les profits
 * @returns {Promise<ethers.providers.TransactionResponse>} - La transaction de liquidation
 */
async function executeLiquidation(wallet, opportunity, profitReceiver) {
  try {
    // Récupérer le contrat de flashloan
    const flashloanProvider = await getFlashloanProvider(wallet);

    // Récupérer le contrat Morpho
    const morphoContract = await getMorphoContract(wallet);

    // Récupérer le contrat du token de dette
    const debtToken = await getERC20Contract(
      opportunity.debtToken.address,
      wallet
    );

    // Récupérer le prix du gaz actuel
    const gasPrice = await getGasPrice(wallet.provider);
    if (
      gasPrice.gt(
        ethers.utils.parseUnits(process.env.MAX_GAS_PRICE || "100", "gwei")
      )
    ) {
      logger.info(
        `Prix du gaz trop élevé: ${ethers.utils.formatUnits(
          gasPrice,
          "gwei"
        )} gwei`
      );
      throw new Error("Prix du gaz trop élevé");
    }

    logger.info(
      `Préparation de la liquidation pour ${
        opportunity.account
      } avec ${ethers.utils.formatUnits(
        opportunity.debtToCover,
        opportunity.debtToken.decimals
      )} ${opportunity.debtToken.symbol}`
    );

    // Encoder les données pour le callback de flashloan
    const liquidationData = ethers.utils.defaultAbiCoder.encode(
      [
        "address", // market address
        "address", // borrower to liquidate
        "address", // debt token
        "address", // collateral token
        "uint256", // debt amount to cover
        "address", // profit receiver
      ],
      [
        opportunity.market,
        opportunity.account,
        opportunity.debtToken.address,
        opportunity.collateralToken.address,
        opportunity.debtToCover,
        profitReceiver,
      ]
    );

    // Paramètres de la transaction
    const txOptions = {
      gasPrice: gasPrice,
      gasLimit: 3000000, // Limite de gaz estimée
    };

    // Exécuter le flashloan
    const tx = await flashloanProvider.executeFlashloan(
      opportunity.debtToken.address, // Token à emprunter
      opportunity.debtToCover, // Montant à emprunter
      liquidationData, // Données pour le callback
      txOptions // Options de la transaction
    );

    logger.info(`Transaction de flashloan soumise: ${tx.hash}`);

    // Attendre la confirmation de la transaction
    const receipt = await tx.wait(1);

    logger.info(
      `Liquidation effectuée! Gaz utilisé: ${receipt.gasUsed.toString()}`
    );

    return receipt;
  } catch (error) {
    logger.error(
      `Erreur lors de l'exécution de la liquidation: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  executeLiquidation,
};
