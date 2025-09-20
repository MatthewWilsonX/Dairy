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
        string content;           // Plaintext content of the diary
        eaddress encryptedAuthor; // Encrypted address of the author
        uint256 timestamp;       // Timestamp when the entry was created
        bool exists;             // Whether this entry exists
    }

    /// @notice Mapping from entry ID to diary entry
    mapping(uint256 => DiaryEntry) private entries;

    /// @notice Counter for generating unique entry IDs
    uint256 private nextEntryId;

    /// @notice Mapping to track which users have access to which entries
    mapping(uint256 => mapping(address => bool)) public entryAccess;

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
            content: content,
            encryptedAuthor: encryptedAuthor,
            timestamp: block.timestamp,
            exists: true
        });

        // Grant access permissions
        FHE.allowThis(encryptedAuthor);
        FHE.allow(encryptedAuthor, msg.sender);

        // Grant access to the entry creator
        entryAccess[entryId][msg.sender] = true;

        emit DiaryEntryAdded(entryId, msg.sender, block.timestamp);
    }

    /// @notice Get a diary entry by ID
    /// @param entryId The ID of the entry to retrieve
    /// @return content The plaintext content
    /// @return encryptedAuthor The encrypted author address
    /// @return timestamp The creation timestamp
    function getEntry(uint256 entryId)
        external
        view
        returns (string memory content, eaddress encryptedAuthor, uint256 timestamp)
    {
        require(entries[entryId].exists, "Entry does not exist");
        require(entryAccess[entryId][msg.sender], "Access denied");

        DiaryEntry storage entry = entries[entryId];
        return (entry.content, entry.encryptedAuthor, entry.timestamp);
    }

    /// @notice Get only the plaintext content of an entry
    /// @param entryId The ID of the entry
    /// @return content The plaintext content
    function getEntryContent(uint256 entryId) external view returns (string memory content) {
        require(entries[entryId].exists, "Entry does not exist");
        require(entryAccess[entryId][msg.sender], "Access denied");

        return entries[entryId].content;
    }

    /// @notice Get only the encrypted author of an entry
    /// @param entryId The ID of the entry
    /// @return encryptedAuthor The encrypted author address
    function getEntryAuthor(uint256 entryId) external view returns (eaddress encryptedAuthor) {
        require(entries[entryId].exists, "Entry does not exist");
        require(entryAccess[entryId][msg.sender], "Access denied");

        return entries[entryId].encryptedAuthor;
    }

    /// @notice Grant access to an entry to another user
    /// @param entryId The ID of the entry
    /// @param user The address to grant access to
    function grantAccess(uint256 entryId, address user) external {
        require(entries[entryId].exists, "Entry does not exist");
        require(entryAccess[entryId][msg.sender], "Only authorized users can grant access");

        entryAccess[entryId][user] = true;

        // Grant FHE access to the encrypted author for the new user
        FHE.allow(entries[entryId].encryptedAuthor, user);

        emit AccessGranted(entryId, user);
    }

    /// @notice Revoke access to an entry from a user
    /// @param entryId The ID of the entry
    /// @param user The address to revoke access from
    function revokeAccess(uint256 entryId, address user) external {
        require(entries[entryId].exists, "Entry does not exist");
        require(entryAccess[entryId][msg.sender], "Only authorized users can revoke access");

        entryAccess[entryId][user] = false;

        emit AccessRevoked(entryId, user);
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

    /// @notice Check if a user has access to an entry
    /// @param entryId The entry ID
    /// @param user The user address
    /// @return userHasAccess Whether the user has access
    function hasAccess(uint256 entryId, address user) external view returns (bool userHasAccess) {
        return entryAccess[entryId][user];
    }
}