import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Header } from './Header';
import { DiaryList } from './DiaryList';
import { DiaryForm } from './DiaryForm';

export const DiaryApp: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              OnChain Diary
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create encrypted diary entries on the blockchain with Zama FHE technology.
              Your thoughts are stored securely with encrypted author information.
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Connect Your Wallet
              </h2>
              <p className="text-gray-600 mb-6">
                Connect your wallet to start creating your encrypted diary entries
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-8">
              <DiaryForm />
              <DiaryList />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};