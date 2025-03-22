const { ethers } = require("ethers");
const { logger } = require("../utils/logger");

// ABI minimal pour un token ERC20
const erc20Abi = [
  // Lecture
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",

  // Écriture
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint amount) returns (bool)",

  // Événements
  "event Transfer(address indexed from, address indexed to, uint amount)",
  "event Approval(address indexed owner, address indexed spender, uint amount)",
];

/**
 * Récupère une instance de contrat ERC20
 * @param {string} tokenAddress - Adresse du token ERC20
 * @param {ethers.Signer|ethers.providers.Provider} signerOrProvider - Un signer ou provider Ethereum
 * @returns {ethers.Contract} - Instance du contrat ERC20
 */
function getERC20Contract(tokenAddress, signerOrProvider) {
  try {
    return new ethers.Contract(tokenAddress, erc20Abi, signerOrProvider);
  } catch (error) {
    logger.error(
      `Erreur lors de la création du contrat ERC20: ${error.message}`
    );
    throw error;
  }
}

/**
 * Récupère le solde d'un token pour une adresse
 * @param {string} tokenAddress - Adresse du token ERC20
 * @param {string} ownerAddress - Adresse du propriétaire
 * @param {ethers.providers.Provider} provider - Provider Ethereum
 * @returns {Promise<ethers.BigNumber>} - Solde du token
 */
async function getTokenBalance(tokenAddress, ownerAddress, provider) {
  try {
    const tokenContract = getERC20Contract(tokenAddress, provider);
    return await tokenContract.balanceOf(ownerAddress);
  } catch (error) {
    logger.error(`Erreur lors de la récupération du solde: ${error.message}`);
    return ethers.BigNumber.from(0);
  }
}

/**
 * Récupère les métadonnées d'un token
 * @param {string} tokenAddress - Adresse du token ERC20
 * @param {ethers.providers.Provider} provider - Provider Ethereum
 * @returns {Promise<Object>} - Informations sur le token
 */
async function getTokenInfo(tokenAddress, provider) {
  try {
    const tokenContract = getERC20Contract(tokenAddress, provider);

    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ]);

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
    };
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération des infos du token: ${error.message}`
    );
    throw error;
  }
}

/**
 * Approuve un contrat à dépenser des tokens
 * @param {string} tokenAddress - Adresse du token ERC20
 * @param {string} spenderAddress - Adresse du contrat qui pourra dépenser les tokens
 * @param {ethers.BigNumber} amount - Montant à approuver
 * @param {ethers.Signer} signer - Un signer Ethereum
 * @returns {Promise<ethers.providers.TransactionResponse>} - Transaction d'approbation
 */
async function approveToken(tokenAddress, spenderAddress, amount, signer) {
  try {
    const tokenContract = getERC20Contract(tokenAddress, signer);

    logger.info(
      `Approbation de ${ethers.utils.formatEther(
        amount
      )} tokens à l'adresse ${spenderAddress}`
    );

    const tx = await tokenContract.approve(spenderAddress, amount);
    await tx.wait(1);

    return tx;
  } catch (error) {
    logger.error(`Erreur lors de l'approbation du token: ${error.message}`);
    throw error;
  }
}

module.exports = {
  getERC20Contract,
  getTokenBalance,
  getTokenInfo,
  approveToken,
};
