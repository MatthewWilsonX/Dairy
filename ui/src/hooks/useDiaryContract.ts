import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from './useZamaInstance';

// Helper function to generate a random Ethereum address
const generateRandomAddress = (): string => {
  const randomBytes = new Uint8Array(20);
  crypto.getRandomValues(randomBytes);
  return '0x' + Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper function to convert string to ArrayBuffer
const stringToArrayBuffer = (str: string): ArrayBuffer => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

// Helper function to convert ArrayBuffer to hex string
const arrayBufferToHex = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper function to convert hex string to ArrayBuffer
const hexToArrayBuffer = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
};

// Helper function to encrypt string content using a key address
const encryptString = async (content: string, keyAddress: string): Promise<string> => {
  try {
    // Ensure keyAddress is in the correct format (normalize)
    let normalizedKeyAddress = keyAddress;
    if (typeof keyAddress === 'string' && keyAddress.startsWith('0x')) {
      normalizedKeyAddress = keyAddress.toLowerCase();
    }
    console.log('encryptString: Using normalized keyAddress:', normalizedKeyAddress);

    // Create a deterministic key from the address using Web Crypto API
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(normalizedKeyAddress),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: stringToArrayBuffer('salt'), // Simple salt, you could make this more sophisticated
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the content
    const encodedContent = stringToArrayBuffer(content);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encodedContent
    );

    // Combine iv + encrypted content
    return arrayBufferToHex(iv) + ':' + arrayBufferToHex(encrypted);
  } catch (error) {
    console.error('Encryption error:', error);
    // Fallback: return original content if encryption fails
    return content;
  }
};

// Helper function to decrypt string content using a key address
const decryptString = async (encryptedContent: string, keyAddress: string): Promise<string> => {
  console.log('decryptString: Starting decryption with:', { encryptedContent, keyAddress });

  try {
    // Check if content is encrypted (contains colon)
    if (!encryptedContent.includes(':')) {
      console.log('decryptString: Content does not appear to be encrypted (no colon found)');
      return encryptedContent; // Return as-is if not encrypted
    }

    const parts = encryptedContent.split(':');
    if (parts.length !== 2) {
      console.log('decryptString: Invalid encrypted content format');
      return encryptedContent; // Return as-is if format is invalid
    }

    const [ivHex, encryptedHex] = parts;
    console.log('decryptString: Parsed IV and encrypted data lengths:', ivHex.length, encryptedHex.length);

    // Ensure keyAddress is in the correct format (normalize)
    let normalizedKeyAddress = keyAddress;
    if (typeof keyAddress === 'string' && keyAddress.startsWith('0x')) {
      normalizedKeyAddress = keyAddress.toLowerCase();
    }
    console.log('decryptString: Normalized keyAddress:', normalizedKeyAddress);

    // Create a deterministic key from the address using Web Crypto API
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(normalizedKeyAddress),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    console.log('decryptString: Key material imported successfully');

    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: stringToArrayBuffer('salt'), // Same salt as encryption
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    console.log('decryptString: Key derived successfully');

    // Convert hex back to ArrayBuffers
    const iv = hexToArrayBuffer(ivHex);
    const encryptedData = hexToArrayBuffer(encryptedHex);
    console.log('decryptString: Converted hex to ArrayBuffers');

    // Decrypt the content
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encryptedData
    );
    console.log('decryptString: Decryption successful');

    // Convert back to string
    const decoder = new TextDecoder();
    const result = decoder.decode(decrypted);
    console.log('decryptString: Decoded result:', result);
    return result;
  } catch (error) {
    console.error('decryptString: Decryption error details:', error);
    throw new Error(`解密失败: ${(error as Error).message}`);
  }
};

export const useDiaryContract = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { instance: fheInstance, isLoading: fheLoading, error: fheError } = useZamaInstance();

  const getContract = async () => {
    if (!walletClient) {
      console.error('useDiaryContract: Wallet not connected');
      throw new Error('Wallet not connected');
    }

    console.log('useDiaryContract: Creating contract with address:', CONTRACT_ADDRESS);
    const provider = new ethers.BrowserProvider(walletClient);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    console.log('useDiaryContract: Created signed contract');
    return contract;
  };

  const getReadOnlyContract = () => {
    if (!publicClient) {
      console.error('useDiaryContract: Public client not available');
      throw new Error('Public client not available');
    }

    console.log('useDiaryContract: Creating read-only contract with address:', CONTRACT_ADDRESS);
    console.log('useDiaryContract: Using RPC URL:', publicClient.transport.url);
    const provider = new ethers.JsonRpcProvider(publicClient.transport.url);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    console.log('useDiaryContract: Created read-only contract');
    return contract;
  };

  const addEntry = async (content: string) => {
    try {
      if (!address) {
        throw new Error('Wallet not connected');
      }

      if (!fheInstance) {
        throw new Error('FHE instance not initialized');
      }

      if (fheLoading) {
        throw new Error('FHE instance still loading');
      }

      if (fheError) {
        throw new Error(`FHE initialization error: ${fheError}`);
      }

      // Create encrypted input for author address
      const input = fheInstance.createEncryptedInput(CONTRACT_ADDRESS, address);

      // Generate random key address for encryption
      const keyAddress = generateRandomAddress();
      console.log('Generated key address:', keyAddress);

      input.addAddress(keyAddress);
      const encryptedInput = await input.encrypt();

      // Get contract instance
      const contract = await getContract();
      console.log("addEntry:", content, encryptedInput.handles[0], encryptedInput.inputProof);

      // Encrypt content using the generated key address
      const encryptContent = await encryptString(content, keyAddress);
      console.log('Encrypted content:', encryptContent);

      // Call addEntry function
      const tx = await contract.addEntry(
        encryptContent,
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      console.log('Transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      return receipt;
    } catch (error) {
      console.error('Error adding diary entry:', error);
      throw error;
    }
  };

  const getTotalEntries = async (): Promise<number> => {
    try {
      console.log('useDiaryContract: Getting total entries');
      const contract = getReadOnlyContract();
      console.log('useDiaryContract: Got read-only contract');
      const total = await contract.getTotalEntries();
      console.log('useDiaryContract: Total entries from contract:', total);
      const totalNumber = Number(total);
      console.log('useDiaryContract: Total entries as number:', totalNumber);
      return totalNumber;
    } catch (error) {
      console.error('useDiaryContract: Error getting total entries:', error);
      throw error;
    }
  };

  const getEntryContent = async (entryId: number): Promise<string> => {
    try {
      console.log(`useDiaryContract: Getting content for entry ${entryId}`);
      const contract = await getContract();
      console.log(`useDiaryContract: Got signed contract for entry ${entryId}`);

      // Get just the content using the dedicated function
      const content = await contract.getEntryContent(entryId);
      console.log(`useDiaryContract: Got content for entry ${entryId}:`, content);

      return content;
    } catch (error) {
      console.error(`useDiaryContract: Error getting entry content for ID ${entryId}:`, error);
      throw error;
    }
  };

  const getEntry = async (entryId: number) => {
    try {
      const contract = await getContract();
      const entry = await contract.getEntry(entryId);
      return {
        content: entry.content,
        encryptedAuthor: entry.encryptedAuthor,
        timestamp: Number(entry.timestamp)
      };
    } catch (error) {
      console.error(`Error getting entry for ID ${entryId}:`, error);
      throw error;
    }
  };



  const entryExists = async (entryId: number): Promise<boolean> => {
    try {
      const contract = getReadOnlyContract();
      const exists = await contract.entryExists(entryId);
      return exists;
    } catch (error) {
      console.error(`Error checking if entry ${entryId} exists:`, error);
      return false;
    }
  };


  const getEntryAuthor = async (entryId: number) => {
    try {
      const contract = await getContract();
      const encryptedAuthor = await contract.getEntryAuthor(entryId);
      return encryptedAuthor;
    } catch (error) {
      console.error(`Error getting entry author for ID ${entryId}:`, error);
      throw error;
    }
  };

  const getUserEntries = async (userAddress: string): Promise<number[]> => {
    try {
      console.log(`useDiaryContract: Getting user entries for address: ${userAddress}`);
      const contract = getReadOnlyContract();
      const entryIds = await contract.getUserEntries(userAddress);
      console.log(`useDiaryContract: Got user entries:`, entryIds);
      return entryIds.map((id: any) => Number(id));
    } catch (error) {
      console.error(`useDiaryContract: Error getting user entries for ${userAddress}:`, error);
      throw error;
    }
  };

  const getUserEntryCount = async (userAddress: string): Promise<number> => {
    try {
      console.log(`useDiaryContract: Getting user entry count for address: ${userAddress}`);
      const contract = getReadOnlyContract();
      const count = await contract.getUserEntryCount(userAddress);
      console.log(`useDiaryContract: Got user entry count:`, count);
      return Number(count);
    } catch (error) {
      console.error(`useDiaryContract: Error getting user entry count for ${userAddress}:`, error);
      throw error;
    }
  };

  return {
    addEntry,
    getTotalEntries,
    getEntryContent,
    getEntry,
    getEntryAuthor,
    entryExists,
    getUserEntries,
    getUserEntryCount,
    decryptString,
    fheLoading,
    fheError
  };
};