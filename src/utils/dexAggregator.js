const axios = require("axios");
const { ethers } = require("ethers");
const { logger } = require("./logger");

/**
 * Estime le montant de tokens qu'on peut obtenir en échangeant un token contre un autre
 * Utilise 1inch API pour obtenir la meilleure route de swap
 * @param {string} fromToken - Adresse du token source
 * @param {string} toToken - Adresse du token destination
 * @param {ethers.BigNumber} amount - Montant à échanger
 * @returns {Promise<ethers.BigNumber>} - Montant estimé de tokens de destination
 */
async function estimateSwapOutput(fromToken, toToken, amount) {
  try {
    // Si même token, retourner le même montant
    if (fromToken === toToken) {
      return amount;
    }

    // Utiliser l'API 1inch pour obtenir une estimation
    const apiUrl = "https://api.1inch.io/v5.0/1/quote";
    const response = await axios.get(apiUrl, {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString(),
        protocols: "UNISWAP_V2,UNISWAP_V3,SUSHISWAP,CURVE",
      },
    });

    if (response.data && response.data.toTokenAmount) {
      return ethers.BigNumber.from(response.data.toTokenAmount);
    } else {
      throw new Error("Réponse API 1inch invalide");
    }
  } catch (error) {
    logger.error(`Erreur lors de l'estimation du swap: ${error.message}`);

    // Estimation de repli si l'API échoue - retour d'une estimation conservatrice
    // Cette valeur devrait être remplacée par une estimation plus précise dans un environnement de production
    return amount.mul(80).div(100); // 80% du montant comme estimation conservatrice
  }
}

/**
 * Crée les données nécessaires pour exécuter un swap via 1inch
 * @param {string} fromToken - Adresse du token source
 * @param {string} toToken - Adresse du token destination
 * @param {ethers.BigNumber} amount - Montant à échanger
 * @param {string} recipient - Adresse du destinataire
 * @returns {Promise<Object>} - Données de la transaction
 */
async function buildSwapTransaction(fromToken, toToken, amount, recipient) {
  try {
    const apiUrl = "https://api.1inch.io/v5.0/1/swap";
    const response = await axios.get(apiUrl, {
      params: {
        fromTokenAddress: fromToken,
        toTokenAddress: toToken,
        amount: amount.toString(),
        fromAddress: recipient,
        destReceiver: recipient,
        slippage: 1, // 1% de slippage
        disableEstimate: true,
      },
    });

    return {
      to: response.data.tx.to,
      data: response.data.tx.data,
      value: ethers.BigNumber.from(response.data.tx.value || 0),
      gasPrice: response.data.tx.gasPrice
        ? ethers.BigNumber.from(response.data.tx.gasPrice)
        : null,
      gas: response.data.tx.gas
        ? ethers.BigNumber.from(response.data.tx.gas)
        : null,
    };
  } catch (error) {
    logger.error(
      `Erreur lors de la création de la transaction de swap: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  estimateSwapOutput,
  buildSwapTransaction,
};
