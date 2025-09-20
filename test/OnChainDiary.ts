import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { OnChainDiary, OnChainDiary__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("OnChainDiary")) as OnChainDiary__factory;
  const onChainDiaryContract = (await factory.deploy()) as OnChainDiary;
  const onChainDiaryContractAddress = await onChainDiaryContract.getAddress();

  return { onChainDiaryContract, onChainDiaryContractAddress };
}

describe("OnChainDiary", function () {
  let signers: Signers;
  let onChainDiaryContract: OnChainDiary;
  let onChainDiaryContractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ onChainDiaryContract, onChainDiaryContractAddress } = await deployFixture());
  });

  it("should deploy correctly and have zero diary count initially", async function () {
    const aliceCount = await onChainDiaryContract.getUserDiaryCount(signers.alice.address);
    const bobCount = await onChainDiaryContract.getUserDiaryCount(signers.bob.address);
    
    expect(aliceCount).to.eq(0);
    expect(bobCount).to.eq(0);
  });

  it("should save a diary entry with encrypted IPFS hash", async function () {
    // Mock IPFS hash as a large number (representing the hash as uint256)
    const mockIpfsHash = "12345678901234567890123456789012345678901234567890123456789012345678";
    const mockIpfsHashBigInt = BigInt(mockIpfsHash);

    // Encrypt the IPFS hash as euint256
    const encryptedIpfsHash = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .add256(mockIpfsHashBigInt)
      .encrypt();

    const beforeCount = await onChainDiaryContract.getUserDiaryCount(signers.alice.address);
    expect(beforeCount).to.eq(0);

    // Save the diary entry
    const tx = await onChainDiaryContract
      .connect(signers.alice)
      .saveDiary(encryptedIpfsHash.handles[0], encryptedIpfsHash.inputProof);
    
    const receipt = await tx.wait();

    // Check diary count increased
    const afterCount = await onChainDiaryContract.getUserDiaryCount(signers.alice.address);
    expect(afterCount).to.eq(1);

    // Check event was emitted
    expect(receipt?.logs).to.have.length.greaterThan(0);
  });

  it("should retrieve a diary entry correctly", async function () {
    // Mock IPFS hash
    const mockIpfsHash = "98765432109876543210987654321098765432109876543210987654321098765432";
    const mockIpfsHashBigInt = BigInt(mockIpfsHash);

    // Encrypt and save diary
    const encryptedIpfsHash = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .add256(mockIpfsHashBigInt)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .saveDiary(encryptedIpfsHash.handles[0], encryptedIpfsHash.inputProof);

    // Retrieve the diary entry
    const [encryptedHash, timestamp] = await onChainDiaryContract.getDiaryEntry(signers.alice.address, 0);

    // Decrypt and verify the hash
    const decryptedHash = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      encryptedHash,
      onChainDiaryContractAddress,
      signers.alice,
    );

    expect(decryptedHash).to.eq(mockIpfsHashBigInt);
    expect(timestamp).to.be.greaterThan(0);
  });

  it("should retrieve latest diary entry", async function () {
    // Save multiple diary entries
    const hashes = [
      BigInt("11111111111111111111111111111111111111111111111111111111111111111111"),
      BigInt("22222222222222222222222222222222222222222222222222222222222222222222"),
      BigInt("33333333333333333333333333333333333333333333333333333333333333333333"),
    ];

    for (const hash of hashes) {
      const encryptedInput = await fhevm
        .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
        .add256(hash)
        .encrypt();

      await onChainDiaryContract
        .connect(signers.alice)
        .saveDiary(encryptedInput.handles[0], encryptedInput.inputProof);
    }

    // Get latest entry
    const [encryptedHash, timestamp, index] = await onChainDiaryContract.getLatestDiary(signers.alice.address);

    // Verify it's the last hash we saved
    const decryptedHash = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      encryptedHash,
      onChainDiaryContractAddress,
      signers.alice,
    );

    expect(decryptedHash).to.eq(hashes[2]); // Should be the last hash
    expect(index).to.eq(2); // Should be index 2 (third entry)
  });

  it("should retrieve all diary entries for a user", async function () {
    const hashes = [
      BigInt("44444444444444444444444444444444444444444444444444444444444444444444"),
      BigInt("55555555555555555555555555555555555555555555555555555555555555555555"),
    ];

    // Save diary entries
    for (const hash of hashes) {
      const encryptedInput = await fhevm
        .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
        .add256(hash)
        .encrypt();

      await onChainDiaryContract
        .connect(signers.alice)
        .saveDiary(encryptedInput.handles[0], encryptedInput.inputProof);
    }

    // Get all diary entries
    const [encryptedHashes, timestamps] = await onChainDiaryContract.getAllDiaries(signers.alice.address);

    expect(encryptedHashes.length).to.eq(2);
    expect(timestamps.length).to.eq(2);

    // Decrypt and verify each hash
    for (let i = 0; i < encryptedHashes.length; i++) {
      const decryptedHash = await fhevm.userDecryptEuint(
        FhevmType.euint256,
        encryptedHashes[i],
        onChainDiaryContractAddress,
        signers.alice,
      );
      expect(decryptedHash).to.eq(hashes[i]);
      expect(timestamps[i]).to.be.greaterThan(0);
    }
  });

  it("should handle multiple users independently", async function () {
    const aliceHash = BigInt("77777777777777777777777777777777777777777777777777777777777777777777");
    const bobHash = BigInt("88888888888888888888888888888888888888888888888888888888888888888888");

    // Alice saves a diary
    const aliceEncrypted = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .add256(aliceHash)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .saveDiary(aliceEncrypted.handles[0], aliceEncrypted.inputProof);

    // Bob saves a diary
    const bobEncrypted = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.bob.address)
      .add256(bobHash)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.bob)
      .saveDiary(bobEncrypted.handles[0], bobEncrypted.inputProof);

    // Verify counts
    expect(await onChainDiaryContract.getUserDiaryCount(signers.alice.address)).to.eq(1);
    expect(await onChainDiaryContract.getUserDiaryCount(signers.bob.address)).to.eq(1);

    // Verify Alice's diary
    const [aliceEncryptedHash] = await onChainDiaryContract.getDiaryEntry(signers.alice.address, 0);
    const aliceDecryptedHash = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      aliceEncryptedHash,
      onChainDiaryContractAddress,
      signers.alice,
    );
    expect(aliceDecryptedHash).to.eq(aliceHash);

    // Verify Bob's diary
    const [bobEncryptedHash] = await onChainDiaryContract.getDiaryEntry(signers.bob.address, 0);
    const bobDecryptedHash = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      bobEncryptedHash,
      onChainDiaryContractAddress,
      signers.bob,
    );
    expect(bobDecryptedHash).to.eq(bobHash);
  });

  it("should revert when trying to access non-existent diary entry", async function () {
    // Try to access diary entry that doesn't exist
    await expect(
      onChainDiaryContract.getDiaryEntry(signers.alice.address, 0)
    ).to.be.revertedWith("Diary entry does not exist");

    await expect(
      onChainDiaryContract.getLatestDiary(signers.alice.address)
    ).to.be.revertedWith("No diary entries found");
  });

  it("should handle time range queries correctly", async function () {
    // Save diary entries with some delay
    const hash1 = BigInt("11111111111111111111111111111111111111111111111111111111111111111111");
    const encrypted1 = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .add256(hash1)
      .encrypt();

    const tx1 = await onChainDiaryContract
      .connect(signers.alice)
      .saveDiary(encrypted1.handles[0], encrypted1.inputProof);
    const receipt1 = await tx1.wait();
    const timestamp1 = (await ethers.provider.getBlock(receipt1!.blockNumber))!.timestamp;

    // Add a small delay for different timestamp
    await new Promise(resolve => setTimeout(resolve, 1000));

    const hash2 = BigInt("22222222222222222222222222222222222222222222222222222222222222222222");
    const encrypted2 = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .add256(hash2)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .saveDiary(encrypted2.handles[0], encrypted2.inputProof);

    // Query for entries in a specific time range
    const [hashes, timestamps, indices] = await onChainDiaryContract.getDiariesInTimeRange(
      signers.alice.address,
      timestamp1,
      timestamp1
    );

    // Should only return the first entry
    expect(hashes.length).to.eq(1);
    expect(timestamps.length).to.eq(1);
    expect(indices.length).to.eq(1);
    expect(indices[0]).to.eq(0);

    const decryptedHash = await fhevm.userDecryptEuint(
      FhevmType.euint256,
      hashes[0],
      onChainDiaryContractAddress,
      signers.alice,
    );
    expect(decryptedHash).to.eq(hash1);
  });
});