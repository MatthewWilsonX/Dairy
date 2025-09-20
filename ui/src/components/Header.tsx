import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg mr-3 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3a2 2 0 012 2v6.5A1.5 1.5 0 108.5 15h3A1.5 1.5 0 1010 13.5V5a2 2 0 012-2z" clipRule="evenodd"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900">OnChain Diary</h1>
            <span className="ml-3 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
              FHE Encrypted
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
}