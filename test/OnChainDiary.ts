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

  it("should deploy correctly and have zero total entries initially", async function () {
    const totalEntries = await onChainDiaryContract.getTotalEntries();
    expect(totalEntries).to.eq(0);
  });

  it("should add a diary entry with encrypted author address", async function () {
    const content = "This is my first diary entry";

    // Create encrypted input for author address
    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    // Add diary entry
    const tx = await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    const receipt = await tx.wait();

    // Check total entries increased
    const totalEntries = await onChainDiaryContract.getTotalEntries();
    expect(totalEntries).to.eq(1);

    // Check the entry exists
    const entryExists = await onChainDiaryContract.entryExists(1);
    expect(entryExists).to.be.true;

    // Check access was granted to the creator
    const hasAccess = await onChainDiaryContract.hasAccess(1, signers.alice.address);
    expect(hasAccess).to.be.true;

    // Check event was emitted
    expect(receipt?.logs).to.have.length.greaterThan(0);
  });

  it("should retrieve a diary entry correctly", async function () {
    const content = "My secret thoughts";

    // Create and add diary entry
    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    // Retrieve the diary entry
    const [retrievedContent, encryptedAuthorHandle, timestamp] = await onChainDiaryContract
      .connect(signers.alice)
      .getEntry(1);

    expect(retrievedContent).to.eq(content);
    expect(timestamp).to.be.greaterThan(0);

    // Decrypt and verify the author address (eaddress is treated as euint160)
    const decryptedAuthor = await fhevm.userDecryptEuint(
      FhevmType.euint160,
      encryptedAuthorHandle,
      onChainDiaryContractAddress,
      signers.alice,
    );

    // Convert BigInt address back to hex string
    const expectedAddress = BigInt(signers.alice.address);
    expect(decryptedAuthor).to.eq(expectedAddress);
  });

  it("should retrieve only content of an entry", async function () {
    const content = "Today was a good day";

    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    const retrievedContent = await onChainDiaryContract
      .connect(signers.alice)
      .getEntryContent(1);

    expect(retrievedContent).to.eq(content);
  });

  it("should retrieve only encrypted author of an entry", async function () {
    const content = "Weather is nice";

    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    const encryptedAuthorHandle = await onChainDiaryContract
      .connect(signers.alice)
      .getEntryAuthor(1);

    // Decrypt and verify the author address (eaddress is treated as euint160)
    const decryptedAuthor = await fhevm.userDecryptEuint(
      FhevmType.euint160,
      encryptedAuthorHandle,
      onChainDiaryContractAddress,
      signers.alice,
    );

    // Convert BigInt address back to hex string
    const expectedAddress = BigInt(signers.alice.address);
    expect(decryptedAuthor).to.eq(expectedAddress);
  });

  it("should grant and revoke access correctly", async function () {
    const content = "Shared diary entry";

    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    // Initially Bob doesn't have access
    let hasAccess = await onChainDiaryContract.hasAccess(1, signers.bob.address);
    expect(hasAccess).to.be.false;

    // Alice grants access to Bob
    await onChainDiaryContract
      .connect(signers.alice)
      .grantAccess(1, signers.bob.address);

    // Now Bob has access
    hasAccess = await onChainDiaryContract.hasAccess(1, signers.bob.address);
    expect(hasAccess).to.be.true;

    // Bob can read the entry
    const [retrievedContent] = await onChainDiaryContract
      .connect(signers.bob)
      .getEntry(1);
    expect(retrievedContent).to.eq(content);

    // Alice revokes access
    await onChainDiaryContract
      .connect(signers.alice)
      .revokeAccess(1, signers.bob.address);

    // Bob no longer has access
    hasAccess = await onChainDiaryContract.hasAccess(1, signers.bob.address);
    expect(hasAccess).to.be.false;
  });

  it("should handle multiple diary entries", async function () {
    const entries = [
      "First entry",
      "Second entry",
      "Third entry"
    ];

    // Add multiple entries
    for (let i = 0; i < entries.length; i++) {
      const encryptedAuthor = await fhevm
        .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
        .addAddress(signers.alice.address)
        .encrypt();

      await onChainDiaryContract
        .connect(signers.alice)
        .addEntry(entries[i], encryptedAuthor.handles[0], encryptedAuthor.inputProof);
    }

    // Check total entries
    const totalEntries = await onChainDiaryContract.getTotalEntries();
    expect(totalEntries).to.eq(3);

    // Verify each entry
    for (let i = 0; i < entries.length; i++) {
      const [content] = await onChainDiaryContract
        .connect(signers.alice)
        .getEntry(i + 1);
      expect(content).to.eq(entries[i]);
    }
  });

  it("should handle multiple users independently", async function () {
    const aliceContent = "Alice's diary";
    const bobContent = "Bob's diary";

    // Alice adds entry
    const aliceEncryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(aliceContent, aliceEncryptedAuthor.handles[0], aliceEncryptedAuthor.inputProof);

    // Bob adds entry
    const bobEncryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.bob.address)
      .addAddress(signers.bob.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.bob)
      .addEntry(bobContent, bobEncryptedAuthor.handles[0], bobEncryptedAuthor.inputProof);

    // Verify Alice's entry
    const [aliceRetrievedContent, aliceEncryptedAuthorHandle] = await onChainDiaryContract
      .connect(signers.alice)
      .getEntry(1);
    expect(aliceRetrievedContent).to.eq(aliceContent);

    const aliceDecryptedAuthor = await fhevm.userDecryptEuint(
      FhevmType.euint160,
      aliceEncryptedAuthorHandle,
      onChainDiaryContractAddress,
      signers.alice,
    );
    expect(aliceDecryptedAuthor).to.eq(BigInt(signers.alice.address));

    // Verify Bob's entry
    const [bobRetrievedContent, bobEncryptedAuthorHandle] = await onChainDiaryContract
      .connect(signers.bob)
      .getEntry(2);
    expect(bobRetrievedContent).to.eq(bobContent);

    const bobDecryptedAuthor = await fhevm.userDecryptEuint(
      FhevmType.euint160,
      bobEncryptedAuthorHandle,
      onChainDiaryContractAddress,
      signers.bob,
    );
    expect(bobDecryptedAuthor).to.eq(BigInt(signers.bob.address));
  });

  it("should revert when trying to access non-existent diary entry", async function () {
    await expect(
      onChainDiaryContract.connect(signers.alice).getEntry(999)
    ).to.be.revertedWith("Entry does not exist");

    await expect(
      onChainDiaryContract.connect(signers.alice).getEntryContent(999)
    ).to.be.revertedWith("Entry does not exist");

    await expect(
      onChainDiaryContract.connect(signers.alice).getEntryAuthor(999)
    ).to.be.revertedWith("Entry does not exist");
  });

  it("should revert when unauthorized user tries to access entry", async function () {
    const content = "Private entry";

    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    // Bob tries to access Alice's entry without permission
    await expect(
      onChainDiaryContract.connect(signers.bob).getEntry(1)
    ).to.be.revertedWith("Access denied");

    await expect(
      onChainDiaryContract.connect(signers.bob).getEntryContent(1)
    ).to.be.revertedWith("Access denied");

    await expect(
      onChainDiaryContract.connect(signers.bob).getEntryAuthor(1)
    ).to.be.revertedWith("Access denied");
  });

  it("should revert when unauthorized user tries to grant/revoke access", async function () {
    const content = "Protected entry";

    const encryptedAuthor = await fhevm
      .createEncryptedInput(onChainDiaryContractAddress, signers.alice.address)
      .addAddress(signers.alice.address)
      .encrypt();

    await onChainDiaryContract
      .connect(signers.alice)
      .addEntry(content, encryptedAuthor.handles[0], encryptedAuthor.inputProof);

    // Bob tries to grant access to himself without permission
    await expect(
      onChainDiaryContract.connect(signers.bob).grantAccess(1, signers.bob.address)
    ).to.be.revertedWith("Only authorized users can grant access");

    // Bob tries to revoke access without permission
    await expect(
      onChainDiaryContract.connect(signers.bob).revokeAccess(1, signers.alice.address)
    ).to.be.revertedWith("Only authorized users can revoke access");
  });
});