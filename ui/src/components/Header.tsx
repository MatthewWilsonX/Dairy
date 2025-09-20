import { ConnectButton } from '@rainbow-me/rainbowkit';
import '../styles/Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6.5A1.5 1.5 0 108.5 15h3A1.5 1.5 0 1010 13.5V5a2 2 0 012-2z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="header-title">OnChain Diary</h1>
          </div>
          <div className="header-right">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}