const { ethers } = require("ethers");
const { logger } = require("./logger");

/**
 * Récupère le prix actuel du gaz
 * @param {ethers.providers.Provider} provider - Le provider Ethereum
 * @returns {Promise<ethers.BigNumber>} - Prix du gaz en wei
 */
async function getGasPrice(provider) {
  try {
    // Tenter d'obtenir le gasPrice de l'API du provider
    const gasPrice = await provider.getGasPrice();

    // Ajouter un petit surplus pour garantir que la transaction soit minée rapidement
    const adjustedGasPrice = gasPrice.mul(110).div(100); // +10%

    logger.debug(
      `Prix du gaz actuel: ${ethers.utils.formatUnits(
        adjustedGasPrice,
        "gwei"
      )} gwei`
    );

    return adjustedGasPrice;
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération du prix du gaz: ${error.message}`
    );

    // Valeur de repli en cas d'erreur
    return ethers.utils.parseUnits("50", "gwei");
  }
}

module.exports = {
  getGasPrice,
};
