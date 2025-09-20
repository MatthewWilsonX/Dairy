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
  const [totalEntries, setTotalEntries] = useState(0);
  const { address } = useAccount();
  const { getTotalEntries, getEntryContent } = useDiaryContract();

  const loadEntries = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const total = await getTotalEntries();
      setTotalEntries(total);

      const entryPromises = [];
      for (let i = 1; i <= total; i++) {
        entryPromises.push(loadSingleEntry(i));
      }

      const loadedEntries = await Promise.all(entryPromises);
      const validEntries = loadedEntries.filter(entry => entry !== null) as DiaryEntry[];

      // Sort by timestamp (newest first)
      validEntries.sort((a, b) => b.timestamp - a.timestamp);
      setEntries(validEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSingleEntry = async (entryId: number): Promise<DiaryEntry | null> => {
    try {
      const content = await getEntryContent(entryId);

      return {
        id: entryId,
        content,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`Error loading entry ${entryId}:`, error);
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
          My Diary Entries ({totalEntries})
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