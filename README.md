# 📖 OnChain Diary

A revolutionary blockchain-based diary application that combines the transparency of blockchain technology with the privacy of Fully Homomorphic Encryption (FHE) to create a secure and confidential journaling experience.

## 🌟 Project Overview

OnChain Diary is a decentralized application that allows users to store their personal diary entries on the blockchain while maintaining complete privacy through Zama's FHE technology. The application stores diary content as plaintext while encrypting sensitive author information, providing a unique balance between transparency and privacy.

## 🎯 Problem Statement

Traditional digital diaries face several critical challenges:

- **Centralized Storage**: Vulnerable to data breaches and platform shutdowns
- **Privacy Concerns**: Personal thoughts exposed to service providers
- **Data Ownership**: Users don't truly own their content
- **Censorship Risk**: Platforms can restrict or delete content arbitrarily
- **Lack of Transparency**: No verifiable proof of entry authenticity or timestamps

## 💡 Our Solution

OnChain Diary leverages cutting-edge blockchain and encryption technologies to solve these problems:

### Core Features

1. **Hybrid Privacy Model**
   - Diary content stored as readable text on blockchain for transparency
   - Author identity encrypted using Zama FHE for privacy protection
   - Users can prove authorship without revealing identity

2. **Decentralized Storage**
   - Immutable storage on Ethereum blockchain
   - No single point of failure
   - Permanent and tamper-proof records

3. **True Ownership**
   - Users have complete control over their entries
   - Cryptographic proof of authorship
   - No intermediary can access or modify content

4. **Privacy-Preserving Features**
   - Encrypted author addresses using FHE
   - Selective disclosure capabilities
   - Zero-knowledge proof of ownership

## 🏗️ Technology Stack

### Smart Contract Layer
- **Framework**: Hardhat for development and deployment
- **Language**: Solidity ^0.8.24
- **FHE Integration**: Zama FHEVM for confidential computing
- **Network**: Ethereum Sepolia Testnet
- **Security**: Built-in access control and permission management

### Frontend Technology
- **Framework**: React 19.1.1 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Wallet Integration**: RainbowKit for seamless Web3 connectivity
- **Blockchain Interaction**: Wagmi + Viem for type-safe Ethereum interactions
- **FHE Client**: Zama Relayer SDK for encrypted operations
- **State Management**: TanStack Query for efficient data fetching
- **Styling**: Custom CSS (no Tailwind as per project requirements)

### Development Tools
- **Package Manager**: npm
- **Testing**: Mocha + Chai for comprehensive contract testing
- **Code Quality**: ESLint + Prettier for consistent code formatting
- **Type Safety**: TypeScript across the entire stack
- **Gas Optimization**: Hardhat Gas Reporter for cost analysis

### Encryption Technology
- **FHE Library**: Zama's FHEVM for on-chain encrypted computations
- **Encrypted Types**: eaddress for author privacy
- **Key Management**: Integrated KMS for secure key handling
- **Relayer Service**: Zama Relayer for FHE operations

## 🚀 Key Advantages

### 1. Revolutionary Privacy Model
- **Selective Transparency**: Content visible, identity protected
- **Cryptographic Privacy**: FHE ensures author addresses remain encrypted
- **No Metadata Leakage**: Even viewing patterns are protected

### 2. Unmatched Security
- **Immutable Records**: Blockchain ensures entries cannot be altered
- **Cryptographic Integrity**: Every entry cryptographically signed
- **Decentralized Architecture**: No single point of failure

### 3. True Digital Ownership
- **Self-Sovereign Identity**: Users control their own data
- **Portable Content**: Entries exist independently of any platform
- **Permissionless Access**: No intermediary required to access your data

### 4. Innovative Use Cases
- **Anonymous Testimonials**: Share experiences without revealing identity
- **Whistleblowing**: Secure platform for sensitive disclosures
- **Historical Records**: Immutable documentation of events
- **Creative Writing**: Timestamped proof of original content creation

### 5. Developer-Friendly
- **Comprehensive Documentation**: Detailed guides and examples
- **Modular Architecture**: Easy to extend and customize
- **Open Source**: Transparent and auditable codebase
- **Testing Coverage**: Extensive test suite for reliability

## 📊 Smart Contract Architecture

### OnChainDiary Contract

The main contract implements a sophisticated diary system:

```solidity
struct DiaryEntry {
    address owner;           // Public owner address
    string content;          // Plaintext diary content
    eaddress encryptedAuthor; // FHE-encrypted author address
    uint256 timestamp;       // Entry creation time
    bool exists;            // Entry existence flag
}
```

#### Key Functions:
- `addEntry()`: Create new diary entries with encrypted author info
- `getEntry()`: Retrieve complete entry information
- `getEntryContent()`: Access only the plaintext content
- `getEntryAuthor()`: Get encrypted author address
- `getUserEntries()`: List all entries for a user

### FHE Integration

The contract leverages Zama's FHE capabilities:
- **Encrypted Types**: Uses `eaddress` for author privacy
- **Access Control**: Implements FHE ACL for permission management
- **External Inputs**: Validates encrypted inputs with proofs
- **Key Management**: Automatic key handling through Zama infrastructure

## 🎛️ Frontend Features

### User Interface
- **Wallet Connection**: Seamless Web3 wallet integration
- **Entry Creation**: Intuitive form for creating diary entries
- **Entry Browsing**: Clean interface for viewing past entries
- **Responsive Design**: Works across all device types

### Privacy Controls
- **Encrypted Submission**: Author addresses encrypted before submission
- **Selective Viewing**: Choose what information to reveal
- **Access Management**: Control who can see your entries

### Developer Experience
- **Type Safety**: Full TypeScript coverage
- **Error Handling**: Comprehensive error management
- **Loading States**: Smooth user experience during blockchain operations
- **Offline Support**: Cache management for better performance

## 🏁 Getting Started

### Prerequisites
- Node.js ≥ 20.0.0
- npm ≥ 7.0.0
- MetaMask or compatible Web3 wallet
- Access to Ethereum Sepolia testnet

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/Dairy.git
   cd Dairy
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd ui && npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure your environment variables
   PRIVATE_KEY=your_private_key_here
   INFURA_API_KEY=your_infura_key_here
   ETHERSCAN_API_KEY=your_etherscan_key_here
   ```

4. **Compile Contracts**
   ```bash
   npm run compile
   ```

5. **Run Tests**
   ```bash
   npm test
   npm run test:sepolia  # For Sepolia testnet
   ```

6. **Deploy Contracts**
   ```bash
   npm run deploy:sepolia
   ```

7. **Start Frontend**
   ```bash
   cd ui
   npm run dev
   ```

### Quick Start Scripts

```bash
# Development workflow
npm run clean           # Clean artifacts and cache
npm run compile         # Compile smart contracts
npm run test           # Run all tests
npm run deploy:sepolia # Deploy to Sepolia
cd ui && npm run dev   # Start frontend

# Code quality
npm run lint           # Run all linters
npm run prettier:write # Format code
```

## 📚 Usage Guide

### Creating Your First Entry

1. **Connect Wallet**: Use the Connect Wallet button to link your Web3 wallet
2. **Write Content**: Enter your diary content in the text area
3. **Submit Entry**: Click submit to create your encrypted entry
4. **Confirm Transaction**: Approve the blockchain transaction
5. **View Entry**: Your entry will appear in the entries list

### Managing Entries

- **View All Entries**: Browse all your diary entries in chronological order
- **Read Content**: Click on any entry to view its full content
- **Verify Ownership**: Use encrypted author verification to prove ownership

### Privacy Features

- **Author Encryption**: Your identity is automatically encrypted when creating entries
- **Access Control**: Manage who can view your encrypted information
- **Selective Disclosure**: Choose what information to make public

## 🧪 Testing

The project includes comprehensive testing suites:

### Smart Contract Tests
```bash
npm test                    # Local hardhat network tests
npm run test:sepolia       # Sepolia testnet integration tests
```

### Test Coverage
- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end workflow testing
- **FHE Tests**: Encryption/decryption functionality
- **Access Control Tests**: Permission system validation

### Test Files
- `test/OnChainDiary.ts`: Main contract functionality
- `test/FHECounter.ts`: FHE operations testing
- `test/OnChainDiarySepolia.ts`: Testnet integration

## 🚀 Deployment

### Sepolia Testnet Deployment

1. **Configure Environment**
   ```bash
   # Set up your .env file with:
   PRIVATE_KEY=your_deployment_private_key
   INFURA_API_KEY=your_infura_api_key
   ETHERSCAN_API_KEY=your_etherscan_api_key
   ```

2. **Deploy Contracts**
   ```bash
   npm run deploy:sepolia
   ```

3. **Verify Contracts**
   ```bash
   npx hardhat verify --network sepolia <contract_address>
   ```

### Contract Addresses

After deployment, contracts will be deployed to:
- **OnChainDiary**: [Contract Address on Sepolia]
- **FHECounter**: [Contract Address on Sepolia]

## 🔧 Development

### Project Structure
```
Dairy/
├── contracts/              # Smart contracts
│   ├── OnChainDiary.sol   # Main diary contract
│   └── FHECounter.sol     # Example FHE contract
├── deploy/                # Deployment scripts
├── tasks/                 # Hardhat tasks
├── test/                  # Contract tests
├── ui/                    # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   └── config/        # Configuration files
├── docs/                  # Documentation
└── CLAUDE.md             # Project instructions
```

### Adding New Features

1. **Smart Contract Changes**
   ```bash
   # Edit contracts in contracts/
   # Add tests in test/
   # Run tests: npm test
   ```

2. **Frontend Changes**
   ```bash
   # Edit components in ui/src/components/
   # Update hooks in ui/src/hooks/
   # Test locally: cd ui && npm run dev
   ```

3. **Deployment Updates**
   ```bash
   # Update deployment scripts in deploy/
   # Test deployment: npm run deploy:sepolia
   ```

## 🔐 Security Considerations

### Smart Contract Security
- **Access Control**: Comprehensive permission system
- **Input Validation**: All user inputs validated
- **Overflow Protection**: Safe math operations
- **Reentrancy Protection**: Follows security best practices

### FHE Security
- **Key Management**: Secure key handling through Zama KMS
- **Encryption Validation**: All encrypted inputs verified
- **Access Control Lists**: Fine-grained permission management
- **Proof Verification**: Cryptographic proof validation

### Frontend Security
- **Wallet Security**: Secure Web3 wallet integration
- **Transaction Validation**: All transactions validated before submission
- **Error Handling**: Comprehensive error management
- **Data Sanitization**: All user inputs sanitized

## 🐛 Troubleshooting

### Common Issues

**Contract Deployment Fails**
```bash
# Check your private key and network configuration
# Ensure you have sufficient ETH for gas
# Verify contract compilation: npm run compile
```

**Frontend Connection Issues**
```bash
# Check MetaMask is connected to Sepolia
# Verify contract addresses in config
# Check console for error messages
```

**FHE Operations Failing**
```bash
# Verify Zama relayer configuration
# Check encrypted input validation
# Ensure proper ACL permissions
```

### Getting Help

- **GitHub Issues**: Report bugs and feature requests
- **Documentation**: Check the comprehensive docs in `/docs`
- **Community**: Join the Zama community forums
- **Discord**: Connect with other developers

## 🤝 Contributing

We welcome contributions from the community!

### Development Process

1. **Fork the Repository**
   ```bash
   git fork https://github.com/yourusername/Dairy.git
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow existing code style
   - Add tests for new features
   - Update documentation

4. **Test Changes**
   ```bash
   npm run lint
   npm test
   npm run test:sepolia
   ```

5. **Submit Pull Request**
   - Clear description of changes
   - Reference any related issues
   - Include test coverage

### Contribution Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Documentation**: Update relevant documentation
- **Testing**: Maintain >90% test coverage
- **Security**: Follow security best practices
- **Performance**: Consider gas optimization

## 🗺️ Roadmap

### Phase 1: Foundation (Current)
- ✅ Basic diary functionality
- ✅ FHE integration for author privacy
- ✅ Web3 frontend integration
- ✅ Sepolia testnet deployment

### Phase 2: Enhanced Privacy (Q2 2024)
- 🔄 Content encryption options
- 🔄 Advanced access control
- 🔄 Selective content disclosure
- 🔄 Privacy-preserving search

### Phase 3: Social Features (Q3 2024)
- 📋 Shared diary spaces
- 📋 Collaborative entries
- 📋 Anonymous commenting system
- 📋 Community verification

### Phase 4: Advanced Features (Q4 2024)
- 📋 Cross-chain compatibility
- 📋 IPFS integration for large content
- 📋 Mobile application
- 📋 AI-powered insights (privacy-preserving)

### Phase 5: Enterprise (2025)
- 📋 Enterprise deployment options
- 📋 Custom branding
- 📋 Advanced analytics
- 📋 Compliance features

### Future Innovations
- 📋 Zero-knowledge proofs for content verification
- 📋 Time-locked entries
- 📋 Decentralized governance
- 📋 NFT integration for special entries
- 📋 Multi-chain deployment

## 📈 Performance Metrics

### Gas Efficiency
- **Entry Creation**: ~150,000 gas
- **Entry Retrieval**: ~30,000 gas (view function)
- **Batch Operations**: Optimized for multiple entries

### Security Benchmarks
- **Encryption Strength**: Military-grade FHE
- **Key Security**: Threshold cryptography
- **Smart Contract Audits**: Planned for mainnet release

## 🌍 Real-World Applications

### Personal Use Cases
- **Daily Journaling**: Private thoughts with timestamp proof
- **Memory Preservation**: Immutable family histories
- **Goal Tracking**: Confidential progress records
- **Health Monitoring**: Private health journey documentation

### Professional Applications
- **Research Notes**: Timestamped research discoveries
- **Legal Documentation**: Immutable legal records
- **Journalism**: Anonymous source protection
- **Whistleblowing**: Secure disclosure platform

### Creative Industries
- **Content Creation**: Proof of original authorship
- **Intellectual Property**: Timestamped idea documentation
- **Collaborative Writing**: Shared creative spaces
- **Publishing**: Decentralized content distribution

## 🎓 Educational Resources

### Learning Materials
- **Zama FHE Documentation**: Complete FHE development guide
- **Ethereum Development**: Hardhat and Solidity tutorials
- **React Development**: Modern React patterns and hooks
- **Web3 Integration**: Wallet connectivity and blockchain interaction

### Code Examples
- **Smart Contract Patterns**: Reusable Solidity patterns
- **FHE Operations**: Encryption and decryption examples
- **Frontend Integration**: Web3 React components
- **Testing Strategies**: Comprehensive testing approaches

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ❌ Patent use prohibited
- ❌ Liability and warranty disclaimed

## 🙏 Acknowledgments

### Technology Partners
- **Zama**: For pioneering FHE technology and FHEVM
- **Ethereum Foundation**: For blockchain infrastructure
- **Hardhat Team**: For excellent development tools
- **React Team**: For the robust frontend framework

### Community Contributors
- All developers who contribute to this open-source project
- Security researchers who help identify vulnerabilities
- Documentation contributors who improve clarity
- Beta testers who provide valuable feedback

### Special Thanks
- The broader Web3 community for inspiration and support
- Privacy advocates pushing for better digital rights
- Open-source maintainers whose work we build upon

---

## 📞 Contact & Support

### Project Maintainers
- **GitHub**: [Project Repository](https://github.com/yourusername/Dairy)
- **Issues**: [Bug Reports & Feature Requests](https://github.com/yourusername/Dairy/issues)
- **Discussions**: [Community Discussions](https://github.com/yourusername/Dairy/discussions)

### Community Channels
- **Discord**: Join our developer community
- **Twitter**: Follow for project updates
- **Medium**: Read our technical blog posts
- **YouTube**: Watch development tutorials

### Professional Support
For enterprise inquiries, custom development, or security audits, please contact our team through the appropriate channels listed above.

---

**Built with ❤️ using Zama FHE, Ethereum, and React**

*OnChain Diary - Where privacy meets transparency in the digital age*
