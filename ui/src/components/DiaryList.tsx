import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';
import '../styles/DiaryList.css';

interface DiaryEntry {
  id: number;
  content: string;
  timestamp: number;
}

export const DiaryList: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEntryCount, setUserEntryCount] = useState(0);
  const { address } = useAccount();
  const { getEntryContent, getUserEntries, getUserEntryCount } = useDiaryContract();

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
      console.log(`DiaryList: Calling getEntryContent for entry ${entryId}`);
      const content = await getEntryContent(entryId);
      console.log(`DiaryList: Got content for entry ${entryId}:`, content);

      const entry = {
        id: entryId,
        content,
        timestamp: Date.now()
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
                <p className="diary-entry-text">{entry.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};