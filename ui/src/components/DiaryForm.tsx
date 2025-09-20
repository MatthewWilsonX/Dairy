import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';

export const DiaryForm: React.FC = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { address } = useAccount();
  const { addEntry, fheLoading, fheError } = useDiaryContract();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please enter diary content');
      return;
    }

    if (!address) {
      alert('Please connect your wallet');
      return;
    }

    setIsLoading(true);

    try {
      await addEntry(content.trim(), address);
      setContent('');
      alert('Diary entry added successfully!');
    } catch (error) {
      console.error('Error adding diary entry:', error);
      alert('Failed to add diary entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        Add New Diary Entry
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Diary Content
          </label>
          <textarea
            id="content"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 resize-vertical"
            placeholder="Write your diary entry here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !content.trim() || fheLoading || !!fheError}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              isLoading || !content.trim() || fheLoading || !!fheError
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            } transition-colors`}
          >
            {fheLoading ? 'Initializing FHE...' : isLoading ? 'Adding Entry...' : 'Add Entry'}
          </button>
        </div>
      </form>

      {fheError && (
        <div className="mt-4 p-4 bg-red-50 rounded-md border border-red-200">
          <h3 className="text-sm font-medium text-red-800 mb-2">FHE Error:</h3>
          <p className="text-sm text-red-700">{fheError}</p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-md">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Privacy Note:</h3>
        <p className="text-sm text-blue-700">
          Your diary content will be stored as plaintext on the blockchain, but your author address
          will be encrypted using Zama FHE technology for privacy protection.
        </p>
      </div>
    </div>
  );
};