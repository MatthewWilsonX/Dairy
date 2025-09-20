import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';

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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          My Diary Entries ({totalEntries})
        </h2>
        <button
          onClick={refreshEntries}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 transition-colors"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading your diary entries...</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No diary entries found. Create your first entry above!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className={`border rounded-lg p-4 ${
                entry.hasAccess
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-600">
                  Entry #{entry.id}
                </span>
                {entry.hasAccess && entry.timestamp > 0 && (
                  <span className="text-sm text-gray-500">
                    {formatDate(entry.timestamp)}
                  </span>
                )}
              </div>

              <div className="text-gray-800">
                {entry.hasAccess ? (
                  <p className="whitespace-pre-wrap">{entry.content}</p>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="italic">{entry.content}</span>
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