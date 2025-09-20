import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Tutorial: Deploy and Interact with OnChainDiary Locally (--network localhost)
 * ==============================================================================
 *
 * 1. From a separate terminal window:
 *
 *   npx hardhat node
 *
 * 2. Deploy the OnChainDiary contract
 *
 *   npx hardhat --network localhost deploy --tags OnChainDiary
 *
 * 3. Interact with the OnChainDiary contract
 *
 *   npx hardhat --network localhost task:diary-address
 *   npx hardhat --network localhost task:save-diary --hash "12345678901234567890123456789012345678901234567890123456789012345678"
 *   npx hardhat --network localhost task:get-diary-count
 *   npx hardhat --network localhost task:get-diary --index 0
 *   npx hardhat --network localhost task:get-latest-diary
 *   npx hardhat --network localhost task:get-all-diaries
 *
 *
 * Tutorial: Deploy and Interact on Sepolia (--network sepolia)
 * =============================================================
 *
 * 1. Deploy the OnChainDiary contract
 *
 *   npx hardhat --network sepolia deploy --tags OnChainDiary
 *
 * 2. Interact with the OnChainDiary contract
 *
 *   npx hardhat --network sepolia task:diary-address
 *   npx hardhat --network sepolia task:save-diary --hash "12345678901234567890123456789012345678901234567890123456789012345678"
 *   npx hardhat --network sepolia task:get-diary-count
 *   npx hardhat --network sepolia task:get-diary --index 0
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
 *   - npx hardhat --network localhost task:save-diary --hash "12345678901234567890123456789012345678901234567890123456789012345678"
 *   - npx hardhat --network sepolia task:save-diary --hash "98765432109876543210987654321098765432109876543210987654321098765432"
 */
task("task:save-diary", "Saves a diary entry with encrypted IPFS hash")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addParam("hash", "The IPFS hash as a big integer string")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const hashValue = taskArguments.hash;
    if (!hashValue || hashValue.length === 0) {
      throw new Error(`Argument --hash is required`);
    }

    let hashBigInt: bigint;
    try {
      hashBigInt = BigInt(hashValue);
    } catch (error) {
      throw new Error(`Argument --hash is not a valid big integer`);
    }

    await fhevm.initializeCLIApi();

    const OnChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${OnChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", OnChainDiaryDeployment.address);

    // Encrypt the IPFS hash as euint256
    const encryptedHash = await fhevm
      .createEncryptedInput(OnChainDiaryDeployment.address, signers[0].address)
      .add256(hashBigInt)
      .encrypt();

    const tx = await onChainDiaryContract
      .connect(signers[0])
      .saveDiary(encryptedHash.handles[0], encryptedHash.inputProof);
    console.log(`Wait for tx:${tx.hash}...`);

    const receipt = await tx.wait();
    console.log(`tx:${tx.hash} status=${receipt?.status}`);

    const diaryCount = await onChainDiaryContract.getUserDiaryCount(signers[0].address);
    console.log(`Total diary entries: ${diaryCount}`);

    console.log(`OnChainDiary saveDiary(${hashValue}) succeeded!`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-diary-count
 *   - npx hardhat --network sepolia task:get-diary-count
 */
task("task:get-diary-count", "Gets the diary count for the current user")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments } = hre;

    const OnChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${OnChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", OnChainDiaryDeployment.address);

    const diaryCount = await onChainDiaryContract.getUserDiaryCount(userAddress);
    console.log(`Diary count for ${userAddress}: ${diaryCount}`);
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-diary --index 0
 *   - npx hardhat --network sepolia task:get-diary --index 0
 */
task("task:get-diary", "Gets a specific diary entry and decrypts it")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .addParam("index", "The index of the diary entry")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const index = parseInt(taskArguments.index);
    if (!Number.isInteger(index) || index < 0) {
      throw new Error(`Argument --index must be a non-negative integer`);
    }

    await fhevm.initializeCLIApi();

    const OnChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${OnChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", OnChainDiaryDeployment.address);

    try {
      const [encryptedHash, timestamp] = await onChainDiaryContract.getDiaryEntry(userAddress, index);

      if (encryptedHash === ethers.ZeroHash) {
        console.log(`Encrypted hash: ${encryptedHash}`);
        console.log("Clear hash    : uninitialized");
        console.log(`Timestamp     : ${new Date(Number(timestamp) * 1000).toISOString()}`);
        return;
      }

      const clearHash = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        encryptedHash,
        OnChainDiaryDeployment.address,
        signers[0],
      );

      console.log(`Encrypted hash: ${encryptedHash}`);
      console.log(`Clear hash    : ${clearHash}`);
      console.log(`Timestamp     : ${new Date(Number(timestamp) * 1000).toISOString()}`);
      console.log(`Index         : ${index}`);

    } catch (error) {
      console.log(`Error retrieving diary entry at index ${index}:`, (error as Error).message);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-latest-diary
 *   - npx hardhat --network sepolia task:get-latest-diary
 */
task("task:get-latest-diary", "Gets the latest diary entry and decrypts it")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const OnChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${OnChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", OnChainDiaryDeployment.address);

    try {
      const [encryptedHash, timestamp, index] = await onChainDiaryContract.getLatestDiary(userAddress);

      if (encryptedHash === ethers.ZeroHash) {
        console.log(`Encrypted hash: ${encryptedHash}`);
        console.log("Clear hash    : uninitialized");
        console.log(`Timestamp     : ${new Date(Number(timestamp) * 1000).toISOString()}`);
        console.log(`Index         : ${index}`);
        return;
      }

      const clearHash = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        encryptedHash,
        OnChainDiaryDeployment.address,
        signers[0],
      );

      console.log(`Latest diary entry:`);
      console.log(`Encrypted hash: ${encryptedHash}`);
      console.log(`Clear hash    : ${clearHash}`);
      console.log(`Timestamp     : ${new Date(Number(timestamp) * 1000).toISOString()}`);
      console.log(`Index         : ${index}`);

    } catch (error) {
      console.log(`Error retrieving latest diary entry:`, (error as Error).message);
    }
  });

/**
 * Example:
 *   - npx hardhat --network localhost task:get-all-diaries
 *   - npx hardhat --network sepolia task:get-all-diaries
 */
task("task:get-all-diaries", "Gets all diary entries for a user and decrypts them")
  .addOptionalParam("address", "Optionally specify the OnChainDiary contract address")
  .addOptionalParam("user", "Optionally specify the user address (defaults to first signer)")
  .addOptionalParam("decrypt", "Whether to decrypt the entries (true/false, defaults to false)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { ethers, deployments, fhevm } = hre;

    const shouldDecrypt = taskArguments.decrypt === "true";
    if (shouldDecrypt) {
      await fhevm.initializeCLIApi();
    }

    const OnChainDiaryDeployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("OnChainDiary");
    console.log(`OnChainDiary: ${OnChainDiaryDeployment.address}`);

    const signers = await ethers.getSigners();
    const userAddress = taskArguments.user || signers[0].address;

    const onChainDiaryContract = await ethers.getContractAt("OnChainDiary", OnChainDiaryDeployment.address);

    try {
      const [encryptedHashes, timestamps] = await onChainDiaryContract.getAllDiaries(userAddress);

      console.log(`Total diary entries for ${userAddress}: ${encryptedHashes.length}`);
      console.log("========================================");

      for (let i = 0; i < encryptedHashes.length; i++) {
        console.log(`Entry ${i}:`);
        console.log(`  Encrypted hash: ${encryptedHashes[i]}`);
        
        if (shouldDecrypt && encryptedHashes[i] !== ethers.ZeroHash) {
          try {
            const clearHash = await fhevm.userDecryptEuint(
              FhevmType.euint256,
              encryptedHashes[i],
              OnChainDiaryDeployment.address,
              signers[0],
            );
            console.log(`  Clear hash    : ${clearHash}`);
          } catch (decryptError) {
            console.log(`  Clear hash    : <decryption failed>`);
          }
        }
        
        console.log(`  Timestamp     : ${new Date(Number(timestamps[i]) * 1000).toISOString()}`);
        console.log("----------------------------------------");
      }

    } catch (error) {
      console.log(`Error retrieving diary entries:`, (error as Error).message);
    }
  });