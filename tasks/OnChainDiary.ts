import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact with OnChainDiary
 * ===============================================
 *
 * 1. Deploy the OnChainDiary contract
 *
 *   npx hardhat --network localhost deploy
 *
 * 2. Interact with the OnChainDiary contract
 *
 *   npx hardhat --network localhost task:diary-address
 *   npx hardhat --network localhost task:add-diary --content "My first diary entry"
 *   npx hardhat --network localhost task:get-total-entries
 *   npx hardhat --network localhost task:get-diary --id 1
 *   npx hardhat --network localhost task:decrypt-author --id 1
 *
 */

/**
 * Example:
 *   - npx hardhat --network localhost task:diary-address
 *   - npx hardhat --network sepolia task:diary-address
 */
task("task:diary-address", "Prints the OnChainDiary address").setAction(async function (_taskArguments: TaskArguments, hre) {
  const { deployments } = hre;

  const onChainDiary = await deployments.get("OnChainDiary");

  console.log("OnChainDiary address is " + onChainDiary.address);
});

/**
 * Example:
 *   - npx hardhat --network localhost task:add-diary --content "Today was a great day!"
 *   - npx hardhat --network sepolia task:add-diary --content "Learning about FHE"
 */
task("task:add-diary", "Adds a new diary entry with encrypted author address")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("content", "The diary entry content")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const content = taskArguments.content;
    if (!content) {
      throw new Error("Diary content is required");
    }

    await fhevm.initializeCLIApi();

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    // Encrypt the author address
    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryDeployment.address, signer.address)
      .addAddress(signer.address)
      .encrypt();

    console.log(`Adding diary entry with content: "${content}"`);
    const tx = await onChainDiaryContract
      .connect(signer)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);

    // Get the entry ID from events
    const totalEntries = await onChainDiaryContract.getTotalEntries();
    console.log(`Diary entry added successfully! Entry ID: ${totalEntries}`);
    console.log(`Total entries: ${totalEntries}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-diary --id 1
 *   - npx hardhat --network sepolia task:get-diary --id 1
 */
task("task:get-diary", "Retrieves a diary entry by ID")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const entryId = parseInt(taskArguments.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    try {
      const [content, encryptedAuthor, timestamp] = await onChainDiaryContract
        .connect(signer)
        .getEntry(entryId);

      console.log(`\n=== Diary Entry ${entryId} ===`);
      console.log(`Content: ${content}`);
      console.log(`Encrypted Author: ${encryptedAuthor}`);
      console.log(`Timestamp: ${new Date(Number(timestamp) * 1000).toISOString()}`);
      console.log(`Created: ${new Date(Number(timestamp) * 1000).toLocaleString()}`);
    } catch (error) {
      console.error(`Failed to retrieve diary entry ${entryId}:`, error);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-diary-content --id 1
 *   - npx hardhat --network sepolia task:get-diary-content --id 1
 */
task("task:get-diary-content", "Retrieves only the content of a diary entry")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const entryId = parseInt(taskArguments.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    try {
      const content = await onChainDiaryContract
        .connect(signer)
        .getEntryContent(entryId);

      console.log(`Entry ${entryId} Content: "${content}"`);
    } catch (error) {
      console.error(`Failed to retrieve diary entry content ${entryId}:`, error);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:decrypt-author --id 1
 *   - npx hardhat --network sepolia task:decrypt-author --id 1
 */
task("task:decrypt-author", "Decrypts and shows the author of a diary entry")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const entryId = parseInt(taskArguments.id);
    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    await fhevm.initializeCLIApi();

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    try {
      const encryptedAuthor = await onChainDiaryContract
        .connect(signer)
        .getEntryAuthor(entryId);

      console.log(`Encrypted Author: ${encryptedAuthor}`);

      // Decrypt the author address (eaddress is treated as euint160)
      const decryptedAuthor = await fhevm.userDecryptEuint(
        FhevmType.euint160,
        encryptedAuthor,
        onChainDiaryDeployment.address,
        signer,
      );

      // Convert BigInt to hex address
      const authorAddress = "0x" + decryptedAuthor.toString(16).padStart(40, "0");
      console.log(`Decrypted Author Address: ${authorAddress}`);
    } catch (error) {
      console.error(`Failed to decrypt author for entry ${entryId}:`, error);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-total-entries
 *   - npx hardhat --network sepolia task:get-total-entries
 */
task("task:get-total-entries", "Gets the total number of diary entries")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    const totalEntries = await onChainDiaryContract.getTotalEntries();
    console.log(`Total diary entries: ${totalEntries}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:grant-access --id 1 --to 0x1234...
 *   - npx hardhat --network sepolia task:grant-access --id 1 --to 0x1234...
 */
task("task:grant-access", "Grants access to a diary entry to another user")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .addParam("to", "The address to grant access to")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const entryId = parseInt(taskArguments.id);
    const toAddress = taskArguments.to;

    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    if (!ethers.isAddress(toAddress)) {
      throw new Error("Invalid address format");
    }

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    console.log(`Granting access to entry ${entryId} for address ${toAddress}`);
    const tx = await onChainDiaryContract
      .connect(signer)
      .grantAccess(entryId, toAddress);

    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);
    console.log(`Access granted successfully!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:revoke-access --id 1 --from 0x1234...
 *   - npx hardhat --network sepolia task:revoke-access --id 1 --from 0x1234...
 */
task("task:revoke-access", "Revokes access to a diary entry from a user")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .addParam("from", "The address to revoke access from")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const entryId = parseInt(taskArguments.id);
    const fromAddress = taskArguments.from;

    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    if (!ethers.isAddress(fromAddress)) {
      throw new Error("Invalid address format");
    }

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const signer = signers[0];

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    console.log(`Revoking access to entry ${entryId} from address ${fromAddress}`);
    const tx = await onChainDiaryContract
      .connect(signer)
      .revokeAccess(entryId, fromAddress);

    console.log(`Wait for tx: ${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx: ${tx.hash} status=${receipt?.status}`);
    console.log(`Access revoked successfully!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:check-access --id 1 --user 0x1234...
 *   - npx hardhat --network sepolia task:check-access --id 1 --user 0x1234...
 */
task("task:check-access", "Checks if a user has access to a diary entry")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("id", "The diary entry ID")
  .addParam("user", "The user address to check")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const entryId = parseInt(taskArguments.id);
    const userAddress = taskArguments.user;

    if (!Number.isInteger(entryId) || entryId <= 0) {
      throw new Error("Entry ID must be a positive integer");
    }

    if (!ethers.isAddress(userAddress)) {
      throw new Error("Invalid address format");
    }

    const onChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${onChainDiaryDeployment.address}`);

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", onChainDiaryDeployment.address);

    const hasAccess = await onChainDiaryContract.hasAccess(entryId, userAddress);
    const entryExists = await onChainDiaryContract.entryExists(entryId);

    console.log(`Entry ${entryId} exists: ${entryExists}`);
    console.log(`User ${userAddress} has access to entry ${entryId}: ${hasAccess}`);
  });