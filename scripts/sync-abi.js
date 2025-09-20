#!/usr/bin/env node

/**
 * Script to sync ABI from deployment to frontend
 * Usage: node scripts/sync-abi.js
 */

const fs = require('fs');
const path = require('path');

// Paths
const deploymentPath = './deployments/sepolia/OnChainDiary.json';
const contractsConfigPath = './ui/src/config/contracts.ts';

try {
  // Read deployment file
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const contractAddress = deployment.address;
  const contractABI = deployment.abi;

  // Generate new contracts.ts content
  const newContent = `// OnChainDiary contract deployed on Sepolia
export const CONTRACT_ADDRESS = '${contractAddress}';

// Generated ABI from deployment - Auto-synced from deployments/sepolia/OnChainDiary.json
export const CONTRACT_ABI = ${JSON.stringify(contractABI, null, 2)} as const;
`;

  // Write to frontend config
  fs.writeFileSync(contractsConfigPath, newContent);

  console.log('✅ ABI synced successfully!');
  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`📝 ABI functions: ${contractABI.filter(item => item.type === 'function').length}`);
  console.log(`📅 Events: ${contractABI.filter(item => item.type === 'event').length}`);

} catch (error) {
  console.error('❌ Error syncing ABI:', error.message);
  process.exit(1);
}