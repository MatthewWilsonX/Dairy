import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';
import '../styles/DiaryList.css';

interface DiaryEntry {
  id: number;
  content: string;
  timestamp: number;
  hasAccess: boolean;
}

export const DiaryList: React.FC = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);
  const { address } = useAccount();
  const { getTotalEntries, getEntryContent, hasAccess } = useDiaryContract();

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
      const userHasAccess = await hasAccess(entryId, address!);

      if (!userHasAccess) {
        return {
          id: entryId,
          content: 'No access to this entry',
          timestamp: 0,
          hasAccess: false
        };
      }

      const content = await getEntryContent(entryId);

      return {
        id: entryId,
        content,
        timestamp: Date.now(), // We'll use current time as placeholder since we can't access timestamp without full entry
        hasAccess: true
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
              className={`diary-entry ${
                entry.hasAccess
                  ? 'diary-entry-accessible'
                  : 'diary-entry-restricted'
              }`}
            >
              <div className="diary-entry-header">
                <span className="diary-entry-id">
                  Entry #{entry.id}
                </span>
                {entry.hasAccess && entry.timestamp > 0 && (
                  <span className="diary-entry-timestamp">
                    {formatDate(entry.timestamp)}
                  </span>
                )}
              </div>

              <div className="diary-entry-content">
                {entry.hasAccess ? (
                  <p className="diary-entry-text">{entry.content}</p>
                ) : (
                  <div className="diary-entry-restricted-content">
                    <svg className="diary-entry-lock-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="diary-entry-restricted-text">{entry.content}</span>
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