# Bot de Liquidation Morpho

Un bot automatisé pour détecter et exécuter des liquidations rentables sur le protocole Morpho en utilisant des flashloans.

## Fonctionnalités

- Surveillance des positions à risque sur les marchés Morpho
- Calcul de la rentabilité des liquidations après swap de tokens
- Utilisation de flashloans pour exécuter les liquidations sans capital initial
- Exécution des 3 liquidations les plus rentables à chaque cycle
- Transfert des profits vers une adresse configurable

## Prérequis

- Node.js v14+
- Accès à un nœud Ethereum (Infura, Alchemy, etc.)
- Clé privée avec suffisamment d'ETH pour payer les frais de gaz

## Installation

1. Cloner le dépôt et installer les dépendances:

```bash
git clone https://github.com/your-username/liquidationbot.git
cd liquidationbot
npm install
```

2. Créer un fichier `.env` à partir du modèle:

```bash
cp .env.example .env
```

3. Configurer les variables d'environnement dans le fichier `.env`:
   - `ETHEREUM_RPC_URL`: URL de votre fournisseur RPC Ethereum
   - `PRIVATE_KEY`: Clé privée du wallet exécutant les transactions
   - `PROFIT_RECEIVER_ADDRESS`: Adresse qui recevra les profits
   - `MORPHO_CONTRACT_ADDRESS`: Adresse du contrat Morpho
   - `AAVE_LENDING_POOL_ADDRESS`: Adresse du pool de prêt AAVE pour les flashloans

## Utilisation

Démarrer le bot:

```bash
npm start
```

Le bot s'exécutera selon l'intervalle configuré dans le fichier `.env` (par défaut toutes les heures).

## Architecture

- `src/index.js`: Point d'entrée et orchestration du bot
- `src/services/`: Services principaux (scanner, exécuteur)
- `src/contracts/`: Interfaces avec les contrats (Morpho, ERC20, flashloans)
- `src/utils/`: Utilitaires (calcul de profit, prix des tokens, journalisation)

## Comment ça fonctionne

1. Le bot analyse périodiquement les positions sur les différents marchés Morpho
2. Pour chaque position à risque, il calcule la rentabilité potentielle après liquidation
3. Les liquidations sont triées par rentabilité et les 3 plus rentables sont exécutées
4. Pour chaque liquidation:
   - Un flashloan est initié pour emprunter le token de dette
   - La position est liquidée, recevant du collatéral en échange
   - Le collatéral est échangé pour rembourser le flashloan
   - Les profits sont envoyés à l'adresse configurée

## Sécurité

- Le bot vérifie la rentabilité avant d'exécuter chaque liquidation
- Il dispose d'un seuil de profit minimum configurable
- Un prix de gaz maximum peut être configuré pour éviter des coûts excessifs
- Les transactions sont simulées avant d'être envoyées

## Avertissement

Ce bot est fourni à titre éducatif. Utilisez-le à vos propres risques. Les marchés DeFi sont volatils et les opportunités de liquidation compétitives.

## Licence

MIT
