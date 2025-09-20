import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';
import { useZamaInstance } from '../hooks/useZamaInstance';
import { CONTRACT_ADDRESS } from '../config/contracts';
import '../styles/DiaryList.css';

interface DiaryEntry {
  id: number;
  content: string;
  timestamp: number;
  isDecrypted: boolean;
  encryptedAuthor?: string;
}

export const DiaryList: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEntryCount, setUserEntryCount] = useState(0);
  const [decryptingEntries, setDecryptingEntries] = useState<Set<number>>(new Set());
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { getUserEntries, getUserEntryCount, getEntry, decryptString } = useDiaryContract();
  const { instance: fheInstance, isLoading: fheLoading } = useZamaInstance();

  const loadEntries = async () => {
    if (!address) {
      console.log('DiaryList: No address, skipping load');
      return;
    }

    console.log('DiaryList: Starting to load entries for address:', address);
    setIsLoading(true);
    try {
      // Get user specific entries
      const userCount = await getUserEntryCount(address);
      console.log('DiaryList: User entry count:', userCount);
      setUserEntryCount(userCount);

      if (userCount === 0) {
        console.log('DiaryList: No user entries to load');
        setEntries([]);
        return;
      }

      const userEntryIds = await getUserEntries(address);
      console.log('DiaryList: User entry IDs:', userEntryIds);

      const entryPromises = userEntryIds.map(entryId => {
        console.log(`DiaryList: Preparing to load user entry ${entryId}`);
        return loadSingleEntry(entryId);
      });

      console.log('DiaryList: Loading', entryPromises.length, 'user entries');
      const loadedEntries = await Promise.all(entryPromises);
      console.log('DiaryList: Loaded user entries:', loadedEntries);

      const validEntries = loadedEntries.filter(entry => entry !== null) as DiaryEntry[];
      console.log('DiaryList: Valid user entries after filtering:', validEntries);

      // Sort by timestamp (newest first)
      validEntries.sort((a, b) => b.timestamp - a.timestamp);
      console.log('DiaryList: Sorted user entries:', validEntries);
      setEntries(validEntries);
    } catch (error) {
      console.error('DiaryList: Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSingleEntry = async (entryId: number): Promise<DiaryEntry | null> => {
    console.log(`DiaryList: Loading single entry ${entryId}`);
    try {
      console.log(`DiaryList: Calling getEntry for entry ${entryId}`);
      const fullEntry = await getEntry(entryId);
      console.log(`DiaryList: Got full entry for ${entryId}:`, fullEntry);

      const entry = {
        id: entryId,
        content: fullEntry.content, // This is the encrypted content
        timestamp: Number(fullEntry.timestamp),
        isDecrypted: false,
        encryptedAuthor: fullEntry.encryptedAuthor
      };
      console.log(`DiaryList: Created entry object for ${entryId}:`, entry);
      return entry;
    } catch (error) {
      console.error(`DiaryList: Error loading entry ${entryId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    if (address) {
      loadEntries();
    }
  }, [address]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const refreshEntries = () => {
    loadEntries();
  };

  const decryptEntry = async (entryId: number) => {
    console.log(`DiaryList: Starting decryption for entry ${entryId}`);

    if (!fheInstance) {
      alert('加密服务未初始化，请稍后再试');
      return;
    }

    if (!walletClient || !address) {
      alert('钱包未连接，请先连接钱包');
      return;
    }

    try {
      // Add to decrypting set to show loading state
      setDecryptingEntries(prev => new Set(prev).add(entryId));

      const entryIndex = entries.findIndex(e => e.id === entryId);
      if (entryIndex === -1) {
        console.error('Entry not found');
        return;
      }

      const entry = entries[entryIndex];
      if (!entry.encryptedAuthor) {
        console.error('No encrypted author found');
        return;
      }

      console.log('DiaryList: Starting Zama user decryption for encrypted author:', entry.encryptedAuthor);

      // Step 1: Decrypt the encryptedAuthor using Zama FHE user decryption
      const keypair = fheInstance.generateKeypair();
      const handleContractPairs = [
        {
          handle: entry.encryptedAuthor,
          contractAddress: CONTRACT_ADDRESS,
        },
      ];

      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = fheInstance.createEIP712(keypair.publicKey, contractAddresses, startTimeStamp, durationDays);

      const signature = await walletClient.signTypedData({
        domain: eip712.domain,
        types: {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        primaryType: 'UserDecryptRequestVerification',
        message: eip712.message,
      });

      console.log('DiaryList: Signature obtained, calling user decrypt...');

      const result = await fheInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays,
      );

      const keyAddress = result[entry.encryptedAuthor];
      console.log('DiaryList: Decrypted keyAddress:', keyAddress);
      console.log('DiaryList: keyAddress type:', typeof keyAddress);
      console.log('DiaryList: keyAddress length:', keyAddress ? keyAddress.length : 'null');

      if (!keyAddress) {
        throw new Error('Failed to decrypt keyAddress');
      }

      // Step 2: Use the keyAddress to decrypt the content
      console.log('DiaryList: Original encrypted content:', entry.content);
      console.log('DiaryList: Decrypting content with keyAddress...');

      // Try to decrypt the content
      let decryptedContent: string;
      try {
        decryptedContent = await decryptString(entry.content, keyAddress);
        console.log('DiaryList: Decrypted content:', decryptedContent);

        // If decryption returns the same content, it means decryption failed
        if (decryptedContent === entry.content) {
          console.warn('DiaryList: Decryption may have failed - content unchanged');
          alert(`解密可能失败:\n原内容: ${entry.content}\n解密后: ${decryptedContent}\nkeyAddress: ${keyAddress}`);
        }
      } catch (decryptError) {
        console.error('DiaryList: Content decryption error:', decryptError);
        throw new Error(`内容解密失败: ${(decryptError as Error).message}`);
      }

      // Step 3: Update the entry with decrypted content
      const updatedEntries = [...entries];
      updatedEntries[entryIndex] = {
        ...entry,
        content: decryptedContent,
        isDecrypted: true
      };
      setEntries(updatedEntries);

      console.log('DiaryList: Entry decryption completed successfully');

    } catch (error) {
      console.error('DiaryList: Error decrypting entry:', error);
      alert('解密失败: ' + (error as Error).message);
    } finally {
      // Remove from decrypting set
      setDecryptingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  if (!address) {
    return null;
  }

  return (
    <div className="diary-list">
      <div className="diary-list-header">
        <h2 className="diary-list-title">
          My Diary Entries ({userEntryCount})
        </h2>
        <button
          onClick={refreshEntries}
          disabled={isLoading}
          className="diary-list-refresh"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="diary-list-loading">
          <div className="diary-list-spinner"></div>
          <p className="diary-list-loading-text">Loading your diary entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="diary-list-empty">
          <p className="diary-list-empty-text">No diary entries found. Create your first entry above!</p>
        </div>
      ) : (
        <div className="diary-list-entries">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="diary-entry diary-entry-accessible"
            >
              <div className="diary-entry-header">
                <span className="diary-entry-id">
                  Entry #{entry.id}
                </span>
                {entry.timestamp > 0 && (
                  <span className="diary-entry-timestamp">
                    {formatDate(entry.timestamp)}
                  </span>
                )}
              </div>

              <div className="diary-entry-content">
                <div className="diary-entry-text-container">
                  <p className="diary-entry-text">{entry.content}</p>
                  {!entry.isDecrypted && (
                    <button
                      className="diary-entry-decrypt-btn"
                      onClick={() => decryptEntry(entry.id)}
                      disabled={decryptingEntries.has(entry.id) || fheLoading}
                      title="解密此日记内容"
                    >
                      {decryptingEntries.has(entry.id) ? '🔄 解密中...' : '🔓 解密'}
                    </button>
                  )}
                  {entry.isDecrypted && (
                    <span className="diary-entry-decrypted-badge">
                      ✅ 已解密
                    </span>
                  )}
                </div>
                {entry.encryptedAuthor && (
                  <div className="diary-entry-meta">
                    <small className="diary-entry-encrypted-author">
                      加密密钥: {entry.encryptedAuthor}
                    </small>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};