// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint256, eaddress, externalEuint256} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title OnChain Diary Contract
/// @notice A contract for storing encrypted diary entries on-chain using IPFS hashes
/// @dev Uses Zama FHE to encrypt IPFS hashes as addresses for privacy
contract OnChainDiary is SepoliaConfig {
    
    struct DiaryEntry {
        euint256 encryptedIpfsHash; // IPFS hash converted to euint256 and encrypted with Zama
        uint256 timestamp;          // When the diary was created
    }
    
    // User address => Array of diary entries
    mapping(address => DiaryEntry[]) private userDiaries;
    
    // User address => Total count of diaries
    mapping(address => uint256) public diaryCount;
    
    event DiaryAdded(address indexed user, uint256 indexed entryIndex, uint256 timestamp);
    
    /// @notice Save a new diary entry with encrypted IPFS hash
    /// @param encryptedIpfsHash The IPFS hash encrypted as euint256 
    /// @param inputProof The proof for the encrypted input
    function saveDiary(
        externalEuint256 encryptedIpfsHash, 
        bytes calldata inputProof
    ) external {
        // Validate and convert external encrypted input
        euint256 validatedHash = FHE.fromExternal(encryptedIpfsHash, inputProof);
        
        // Create new diary entry
        DiaryEntry memory newEntry = DiaryEntry({
            encryptedIpfsHash: validatedHash,
            timestamp: block.timestamp
        });
        
        // Store the entry
        userDiaries[msg.sender].push(newEntry);
        uint256 entryIndex = userDiaries[msg.sender].length - 1;
        diaryCount[msg.sender]++;
        
        // Grant access permissions
        FHE.allowThis(validatedHash);
        FHE.allow(validatedHash, msg.sender);
        
        emit DiaryAdded(msg.sender, entryIndex, block.timestamp);
    }
    
    /// @notice Get a specific diary entry by index
    /// @param user The user whose diary to retrieve
    /// @param index The index of the diary entry
    /// @return encryptedIpfsHash The encrypted IPFS hash
    /// @return timestamp The timestamp when diary was created
    function getDiaryEntry(
        address user, 
        uint256 index
    ) external view returns (euint256, uint256) {
        require(index < userDiaries[user].length, "Diary entry does not exist");
        
        DiaryEntry memory entry = userDiaries[user][index];
        return (entry.encryptedIpfsHash, entry.timestamp);
    }
    
    /// @notice Get all diary entries for a user (returns encrypted hashes and timestamps)
    /// @param user The user whose diaries to retrieve
    /// @return encryptedHashes Array of encrypted IPFS hashes
    /// @return timestamps Array of timestamps
    function getAllDiaries(
        address user
    ) external view returns (euint256[] memory encryptedHashes, uint256[] memory timestamps) {
        uint256 count = userDiaries[user].length;
        encryptedHashes = new euint256[](count);
        timestamps = new uint256[](count);
        
        for (uint256 i = 0; i < count; i++) {
            encryptedHashes[i] = userDiaries[user][i].encryptedIpfsHash;
            timestamps[i] = userDiaries[user][i].timestamp;
        }
        
        return (encryptedHashes, timestamps);
    }
    
    /// @notice Get diary entries for a specific user within a time range
    /// @param user The user whose diaries to retrieve
    /// @param startTime Start timestamp (inclusive)
    /// @param endTime End timestamp (inclusive)
    /// @return encryptedHashes Array of encrypted IPFS hashes in time range
    /// @return timestamps Array of timestamps in time range
    /// @return indices Array of indices of the entries in the user's diary list
    function getDiariesInTimeRange(
        address user,
        uint256 startTime,
        uint256 endTime
    ) external view returns (
        euint256[] memory encryptedHashes, 
        uint256[] memory timestamps,
        uint256[] memory indices
    ) {
        require(startTime <= endTime, "Invalid time range");
        
        // First pass: count entries in range
        uint256 matchCount = 0;
        for (uint256 i = 0; i < userDiaries[user].length; i++) {
            if (userDiaries[user][i].timestamp >= startTime && 
                userDiaries[user][i].timestamp <= endTime) {
                matchCount++;
            }
        }
        
        // Initialize arrays
        encryptedHashes = new euint256[](matchCount);
        timestamps = new uint256[](matchCount);
        indices = new uint256[](matchCount);
        
        // Second pass: populate arrays
        uint256 currentIndex = 0;
        for (uint256 i = 0; i < userDiaries[user].length; i++) {
            if (userDiaries[user][i].timestamp >= startTime && 
                userDiaries[user][i].timestamp <= endTime) {
                encryptedHashes[currentIndex] = userDiaries[user][i].encryptedIpfsHash;
                timestamps[currentIndex] = userDiaries[user][i].timestamp;
                indices[currentIndex] = i;
                currentIndex++;
            }
        }
        
        return (encryptedHashes, timestamps, indices);
    }
    
    /// @notice Get the total number of diary entries for a user
    /// @param user The user to check
    /// @return The total count of diary entries
    function getUserDiaryCount(address user) external view returns (uint256) {
        return userDiaries[user].length;
    }
    
    /// @notice Get the latest diary entry for a user
    /// @param user The user whose latest diary to retrieve
    /// @return encryptedIpfsHash The encrypted IPFS hash of latest entry
    /// @return timestamp The timestamp of latest entry
    /// @return index The index of the latest entry
    function getLatestDiary(
        address user
    ) external view returns (euint256, uint256, uint256) {
        require(userDiaries[user].length > 0, "No diary entries found");
        
        uint256 latestIndex = userDiaries[user].length - 1;
        DiaryEntry memory latestEntry = userDiaries[user][latestIndex];
        
        return (latestEntry.encryptedIpfsHash, latestEntry.timestamp, latestIndex);
    }
}