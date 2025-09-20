import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useZamaInstance } from './useZamaInstance';

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

  const addEntry = async (content: string, authorAddress: string) => {
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
      input.addAddress(authorAddress);
      const encryptedInput = await input.encrypt();

      // Get contract instance
      const contract =await getContract();
      console.log("addEntry:",content,        encryptedInput.handles[0],
        encryptedInput.inputProof);
      
      // Call addEntry function
      const tx = await contract.addEntry(
        content,
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
    fheLoading,
    fheError
  };
};