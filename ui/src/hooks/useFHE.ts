import { useState, useEffect } from 'react';
import { createInstance, SepoliaConfig, initSDK } from '@zama-fhe/relayer-sdk/bundle';

interface FHEInstance {
  instance: any;
  isLoading: boolean;
  error: string | null;
}

export const useFHE = (): FHEInstance => {
  const [instance, setInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeFHE = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Initialize the Zama FHE SDK
        await initSDK();

        // Create the FHE instance
        const fheInstance = await createInstance(SepoliaConfig);

        setInstance(fheInstance);
      } catch (err) {
        console.error('Error initializing FHE:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize FHE');
      } finally {
        setIsLoading(false);
      }
    };

    initializeFHE();
  }, []);

  return { instance, isLoading, error };
};