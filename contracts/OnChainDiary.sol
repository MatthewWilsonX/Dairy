// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, eaddress, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OnChainDiary - A confidential diary contract using Zama FHE
/// @author Zama FHE
/// @notice This contract allows users to store diary entries with encrypted author addresses while keeping content as plaintext
contract OnChainDiary is SepoliaConfig {
    /// @notice Structure representing a diary entry
    struct DiaryEntry {
        address owner;
        string content; // Plaintext content of the diary
        eaddress encryptedAuthor; // Encrypted address of the author
        uint256 timestamp; // Timestamp when the entry was created
        bool exists; // Whether this entry exists
    }

    /// @notice Mapping from entry ID to diary entry
    mapping(uint256 => DiaryEntry) private entries;

    /// @notice Mapping from user address to their entry IDs
    mapping(address => uint256[]) private userEntries;

    /// @notice Counter for generating unique entry IDs
    uint256 private nextEntryId;

    /// @notice Events
    event DiaryEntryAdded(uint256 indexed entryId, address indexed author, uint256 timestamp);
    event AccessGranted(uint256 indexed entryId, address indexed user);
    event AccessRevoked(uint256 indexed entryId, address indexed user);

    /// @notice Initialize the contract
    constructor() {
        nextEntryId = 1;
    }

    /// @notice Add a new diary entry with encrypted author address
    /// @param content The plaintext content of the diary entry
    /// @param encryptedAuthorInput The encrypted author address input
    /// @param inputProof The proof for the encrypted input
    /// @return entryId The ID of the created entry
    function addEntry(
        string calldata content,
        externalEaddress encryptedAuthorInput,
        bytes calldata inputProof
    ) external returns (uint256 entryId) {
        // Validate and convert external encrypted input
        eaddress encryptedAuthor = FHE.fromExternal(encryptedAuthorInput, inputProof);

        entryId = nextEntryId++;

        // Create the diary entry
        entries[entryId] = DiaryEntry({
            owner: msg.sender,
            content: content,
            encryptedAuthor: encryptedAuthor,
            timestamp: block.timestamp,
            exists: true
        });

        // Add entry ID to user's list
        userEntries[msg.sender].push(entryId);

        // Grant access permissions
        FHE.allowThis(encryptedAuthor);
        FHE.allow(encryptedAuthor, msg.sender);

        emit DiaryEntryAdded(entryId, msg.sender, block.timestamp);
    }

    function getEntry(uint256 entryId) external view returns (DiaryEntry memory) {
        require(entries[entryId].exists, "Entry does not exist");

        DiaryEntry storage entry = entries[entryId];
        return entry;
    }

    /// @notice Get only the plaintext content of an entry
    /// @param entryId The ID of the entry
    /// @return content The plaintext content
    function getEntryContent(uint256 entryId) external view returns (string memory content) {
        require(entries[entryId].exists, "Entry does not exist");

        return entries[entryId].content;
    }

    /// @notice Get only the encrypted author of an entry
    /// @param entryId The ID of the entry
    /// @return encryptedAuthor The encrypted author address
    function getEntryAuthor(uint256 entryId) external view returns (eaddress encryptedAuthor) {
        require(entries[entryId].exists, "Entry does not exist");

        return entries[entryId].encryptedAuthor;
    }

    /// @notice Check if an entry exists
    /// @param entryId The ID to check
    /// @return exists Whether the entry exists
    function entryExists(uint256 entryId) external view returns (bool exists) {
        return entries[entryId].exists;
    }

    /// @notice Get the total number of entries created
    /// @return count The total count of entries
    function getTotalEntries() external view returns (uint256 count) {
        return nextEntryId - 1;
    }

    /// @notice Get the number of diary entries for a specific user
    /// @param user The address of the user
    /// @return count The number of diary entries for the user
    function getUserEntryCount(address user) external view returns (uint256 count) {
        return userEntries[user].length;
    }

    /// @notice Get all entry IDs for a specific user
    /// @param user The address of the user
    /// @return entryIds Array of entry IDs belonging to the user
    function getUserEntries(address user) external view returns (uint256[] memory entryIds) {
        return userEntries[user];
    }

    /// @notice Get a specific entry ID for a user by index
    /// @param user The address of the user
    /// @param index The index in the user's entry list
    /// @return entryId The entry ID at the specified index
    function getUserEntryByIndex(address user, uint256 index) external view returns (uint256 entryId) {
        require(index < userEntries[user].length, "Index out of bounds");
        return userEntries[user][index];
    }
}
