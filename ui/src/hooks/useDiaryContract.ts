import { ethers } from 'ethers';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useFHE } from './useFHE';

export const useDiaryContract = () => {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { instance: fheInstance, isLoading: fheLoading, error: fheError } = useFHE();

  const getContract = () => {
    if (!walletClient) {
      throw new Error('Wallet not connected');
    }

    const provider = new ethers.BrowserProvider(walletClient);
    const signer = provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
  };

  const getReadOnlyContract = () => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    const provider = new ethers.JsonRpcProvider(publicClient.transport.url);
    return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
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
      const contract = getContract();

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
      const contract = getReadOnlyContract();
      const total = await contract.getTotalEntries();
      return Number(total);
    } catch (error) {
      console.error('Error getting total entries:', error);
      throw error;
    }
  };

  const getEntryContent = async (entryId: number): Promise<string> => {
    try {
      const contract = getContract(); // Use signed contract to check access
      const content = await contract.getEntryContent(entryId);
      return content;
    } catch (error) {
      console.error(`Error getting entry content for ID ${entryId}:`, error);
      throw error;
    }
  };

  const getEntry = async (entryId: number) => {
    try {
      const contract = getContract();
      const [content, encryptedAuthor, timestamp] = await contract.getEntry(entryId);
      return {
        content,
        encryptedAuthor,
        timestamp: Number(timestamp)
      };
    } catch (error) {
      console.error(`Error getting entry for ID ${entryId}:`, error);
      throw error;
    }
  };

  const hasAccess = async (entryId: number, userAddress: string): Promise<boolean> => {
    try {
      const contract = getReadOnlyContract();
      const access = await contract.hasAccess(entryId, userAddress);
      return access;
    } catch (error) {
      console.error(`Error checking access for entry ${entryId}:`, error);
      return false;
    }
  };

  const grantAccess = async (entryId: number, userAddress: string) => {
    try {
      const contract = getContract();
      const tx = await contract.grantAccess(entryId, userAddress);
      console.log('Grant access transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Grant access transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error(`Error granting access for entry ${entryId}:`, error);
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

  const revokeAccess = async (entryId: number, userAddress: string) => {
    try {
      const contract = getContract();
      const tx = await contract.revokeAccess(entryId, userAddress);
      console.log('Revoke access transaction sent:', tx.hash);
      const receipt = await tx.wait();
      console.log('Revoke access transaction confirmed:', receipt);
      return receipt;
    } catch (error) {
      console.error(`Error revoking access for entry ${entryId}:`, error);
      throw error;
    }
  };

  const getEntryAuthor = async (entryId: number) => {
    try {
      const contract = getContract();
      const encryptedAuthor = await contract.getEntryAuthor(entryId);
      return encryptedAuthor;
    } catch (error) {
      console.error(`Error getting entry author for ID ${entryId}:`, error);
      throw error;
    }
  };

  return {
    addEntry,
    getTotalEntries,
    getEntryContent,
    getEntry,
    getEntryAuthor,
    hasAccess,
    grantAccess,
    revokeAccess,
    entryExists,
    fheLoading,
    fheError
  };
};