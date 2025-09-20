import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Header } from './Header';
import { DiaryList } from './DiaryList';
import { DiaryForm } from './DiaryForm';
import '../styles/App.css';

export const DiaryApp: React.FC = () => {
  const { isConnected } = useAccount();

  return (
    <div className="app-container">
      <Header />

      <main className="main-content">
        <div className="content-wrapper">
          <div className="title-section">
            <h1 className="main-title">
              OnChain Diary
            </h1>
            <p className="main-subtitle">
              Create encrypted diary entries on the blockchain with Zama FHE technology.
              Your thoughts are stored securely with encrypted author information.
            </p>
          </div>

          {!isConnected ? (
            <div className="connect-card">
              <h2 className="connect-title">
                Connect Your Wallet
              </h2>
              <p className="connect-subtitle">
                Connect your wallet to start creating your encrypted diary entries
              </p>
              <ConnectButton />
            </div>
          ) : (
            <div className="content-sections">
              <DiaryForm />
              <DiaryList />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};