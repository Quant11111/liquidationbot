const { ethers } = require("ethers");
const { logger } = require("../utils/logger");

// ABI simplifié du contrat Morpho pour les interactions de liquidation
const morphoAbi = [
  // Fonction pour liquider un emprunteur
  "function liquidate(address _poolToken, address _borrower, uint256 _amount) external returns (uint256)",
  // Fonction pour vérifier si un compte est liquidable
  "function isLiquidatable(address _poolToken, address _borrower) external view returns (bool)",
  // Récupérer le facteur de santé d'un emprunteur
  "function getHealthFactor(address _poolToken, address _borrower) external view returns (uint256)",
  // Récupérer les positions d'un utilisateur
  "function getUserMarketData(address _poolToken, address _borrower) external view returns (uint256, uint256, uint256, uint256)",
];

/**
 * Récupère une instance du contrat Morpho
 * @param {ethers.Signer} signerOrProvider - Un signer ou provider Ethereum
 * @returns {ethers.Contract} - Instance du contrat Morpho
 */
function getMorphoContract(signerOrProvider) {
  try {
    const morphoAddress = process.env.MORPHO_CONTRACT_ADDRESS;

    if (!morphoAddress) {
      throw new Error(
        "L'adresse du contrat Morpho n'est pas définie dans les variables d'environnement"
      );
    }

    return new ethers.Contract(morphoAddress, morphoAbi, signerOrProvider);
  } catch (error) {
    logger.error(
      `Erreur lors de la création du contrat Morpho: ${error.message}`
    );
    throw error;
  }
}

/**
 * Vérifie si un compte est liquidable sur Morpho
 * @param {ethers.Contract} morphoContract - Instance du contrat Morpho
 * @param {string} poolToken - Adresse du token du pool
 * @param {string} borrower - Adresse de l'emprunteur
 * @returns {Promise<boolean>} - True si le compte est liquidable
 */
async function isAccountLiquidatable(morphoContract, poolToken, borrower) {
  try {
    return await morphoContract.isLiquidatable(poolToken, borrower);
  } catch (error) {
    logger.error(
      `Erreur lors de la vérification de la liquidabilité: ${error.message}`
    );
    return false;
  }
}

/**
 * Récupère le facteur de santé d'un compte
 * @param {ethers.Contract} morphoContract - Instance du contrat Morpho
 * @param {string} poolToken - Adresse du token du pool
 * @param {string} borrower - Adresse de l'emprunteur
 * @returns {Promise<ethers.BigNumber>} - Facteur de santé
 */
async function getAccountHealthFactor(morphoContract, poolToken, borrower) {
  try {
    return await morphoContract.getHealthFactor(poolToken, borrower);
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération du facteur de santé: ${error.message}`
    );
    return ethers.constants.MaxUint256; // Valeur maximale comme indicateur d'erreur
  }
}

module.exports = {
  getMorphoContract,
  isAccountLiquidatable,
  getAccountHealthFactor,
};
