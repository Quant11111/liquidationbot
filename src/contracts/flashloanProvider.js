const { ethers } = require("ethers");
const { logger } = require("../utils/logger");

// ABI pour le contrat de flashloan
const flashloanProviderAbi = [
  // Fonction pour exécuter un flashloan
  "function executeFlashloan(address token, uint256 amount, bytes calldata data) external returns (bool)",
  // Événement émis lors d'un flashloan
  "event FlashloanExecuted(address indexed initiator, address indexed token, uint256 amount, uint256 fee)",
];

// Contrat de wrapper flashloan pour la liquidation (implémentation simplifiée)
// Ce contrat serait déployé séparément et appelé pour effectuer les flashloans
const flashloanWrapperAbi = [
  // Fonction pour le callback de flashloan
  "function executeOperation(address[] calldata assets, uint256[] calldata amounts, uint256[] calldata premiums, address initiator, bytes calldata params) external returns (bool)",
  // Fonction pour liquider via Morpho après le flashloan
  "function liquidateMorphoPosition(address morpho, address market, address borrower, address debtToken, address collateralToken, uint256 debtAmount) external returns (uint256)",
  // Fonction pour échanger des tokens via DEX
  "function swapTokensAndSendProfit(address fromToken, address toToken, uint256 amount, address recipient) external returns (uint256)",
];

/**
 * Récupère une instance du contrat fournisseur de flashloan
 * @param {ethers.Signer} signer - Un signer Ethereum
 * @returns {ethers.Contract} - Instance du contrat de flashloan
 */
function getFlashloanProvider(signer) {
  try {
    const flashloanAddress = process.env.AAVE_LENDING_POOL_ADDRESS;

    if (!flashloanAddress) {
      throw new Error(
        "L'adresse du fournisseur de flashloan n'est pas définie dans les variables d'environnement"
      );
    }

    return new ethers.Contract(flashloanAddress, flashloanProviderAbi, signer);
  } catch (error) {
    logger.error(
      `Erreur lors de la création du contrat de flashloan: ${error.message}`
    );
    throw error;
  }
}

/**
 * Récupère une instance du contrat wrapper de flashloan
 * @param {ethers.Signer} signer - Un signer Ethereum
 * @returns {ethers.Contract} - Instance du contrat wrapper
 */
function getFlashloanWrapper(signer) {
  try {
    // Dans une implémentation réelle, cette adresse serait stockée dans les variables d'environnement
    const wrapperAddress = "0x1234567890123456789012345678901234567890"; // exemple
    return new ethers.Contract(wrapperAddress, flashloanWrapperAbi, signer);
  } catch (error) {
    logger.error(
      `Erreur lors de la création du contrat wrapper de flashloan: ${error.message}`
    );
    throw error;
  }
}

/**
 * Encode les données pour un flashloan AAVE v2
 * @param {Object} params - Paramètres pour le flashloan
 * @returns {string} - Données encodées en hexadécimal
 */
function encodeFlashloanParams(params) {
  try {
    return ethers.utils.defaultAbiCoder.encode(
      [
        "address", // Morpho contract
        "address", // Market
        "address", // Borrower
        "address", // Debt token
        "address", // Collateral token
        "uint256", // Debt amount
        "address", // Profit receiver
      ],
      [
        params.morphoContract,
        params.market,
        params.borrower,
        params.debtToken,
        params.collateralToken,
        params.debtAmount,
        params.profitReceiver,
      ]
    );
  } catch (error) {
    logger.error(
      `Erreur lors de l'encodage des paramètres de flashloan: ${error.message}`
    );
    throw error;
  }
}

module.exports = {
  getFlashloanProvider,
  getFlashloanWrapper,
  encodeFlashloanParams,
};
