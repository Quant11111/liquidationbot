const { ethers } = require("ethers");
const { logger } = require("./logger");
const { estimateSwapOutput } = require("./dexAggregator");

/**
 * Calcule le profit estimé après le swap des tokens reçus lors d'une liquidation
 * @param {ethers.BigNumber} collateralAmount - Montant de collatéral reçu
 * @param {Object} collateralToken - Token de collatéral
 * @param {ethers.BigNumber} debtAmount - Montant de dette à rembourser
 * @param {Object} debtToken - Token de dette
 * @param {Object} tokenPrices - Prix des tokens
 * @returns {Promise<ethers.BigNumber>} - Profit estimé en ETH
 */
async function calculateProfitAfterSwap(
  collateralAmount,
  collateralToken,
  debtAmount,
  debtToken,
  tokenPrices
) {
  try {
    // Si les tokens sont les mêmes, le profit est direct
    if (collateralToken.address === debtToken.address) {
      const profit = collateralAmount.sub(debtAmount);
      return convertToEth(profit, debtToken, tokenPrices);
    }

    // Estimer le montant de tokens de dette que nous pouvons obtenir en swappant le collatéral
    const estimatedOutput = await estimateSwapOutput(
      collateralToken.address,
      debtToken.address,
      collateralAmount
    );

    // Calculer le profit
    const profit = estimatedOutput.sub(debtAmount);

    // Convertir le profit en ETH pour standardisation
    const profitInEth = convertToEth(profit, debtToken, tokenPrices);

    // Estimer les coûts de gas
    const estimatedGasCost = ethers.utils.parseEther("0.01"); // Estimation fixe pour simplifier

    // Profit net après frais de gas
    const netProfit = profitInEth.sub(estimatedGasCost);

    return netProfit;
  } catch (error) {
    logger.error(`Erreur lors du calcul du profit: ${error.message}`);
    return ethers.BigNumber.from(0);
  }
}

/**
 * Convertit un montant de token en équivalent ETH
 * @param {ethers.BigNumber} amount - Montant en unités du token
 * @param {Object} token - Informations sur le token
 * @param {Object} tokenPrices - Prix des tokens
 * @returns {ethers.BigNumber} - Montant en ETH
 */
function convertToEth(amount, token, tokenPrices) {
  const tokenPriceInEth = tokenPrices[token.address] / tokenPrices.ETH;

  // Ajuster le montant en fonction des décimales du token
  const adjustedAmount = amount
    .mul(ethers.constants.WeiPerEther)
    .div(ethers.BigNumber.from(10).pow(token.decimals));

  // Convertir en ETH en fonction du prix
  return adjustedAmount
    .mul(ethers.utils.parseEther(tokenPriceInEth.toString()))
    .div(ethers.constants.WeiPerEther);
}

module.exports = {
  calculateProfitAfterSwap,
};
