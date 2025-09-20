import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { useDiaryContract } from '../hooks/useDiaryContract';
import '../styles/DiaryForm.css';

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
      await addEntry(content.trim());
      setContent('');
      alert('Diary entry added successfully!');
    } catch (error) {
      console.error('Error adding diary entry:', error);
      alert('Failed to add diary entry. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isButtonDisabled = isLoading || !content.trim() || fheLoading || !!fheError;

  return (
    <div className="diary-form">
      <h2 className="diary-form-title">
        Add New Diary Entry
      </h2>

      <form onSubmit={handleSubmit} className="diary-form-form">
        <div className="diary-form-group">
          <label htmlFor="content" className="diary-form-label">
            Diary Content
          </label>
          <textarea
            id="content"
            rows={6}
            className="diary-form-textarea"
            placeholder="Write your diary entry here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div className="diary-form-submit">
          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`diary-form-button ${
              isButtonDisabled
                ? 'diary-form-button-disabled'
                : 'diary-form-button-active'
            }`}
          >
            {fheLoading ? 'Initializing FHE...' : isLoading ? 'Adding Entry...' : 'Add Entry'}
          </button>
        </div>
      </form>

      {fheError && (
        <div className="diary-form-error">
          <h3 className="diary-form-error-title">FHE Error:</h3>
          <p className="diary-form-error-text">{fheError}</p>
        </div>
      )}

      <div className="diary-form-note">
        <h3 className="diary-form-note-title">Privacy Note:</h3>
        <p className="diary-form-note-text">
          Your diary content will be stored as plaintext on the blockchain, but your author address
          will be encrypted using Zama FHE technology for privacy protection.
        </p>
      </div>
    </div>
  );
};