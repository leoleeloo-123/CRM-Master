// Hook for managing data based on storage mode
import { useState, useEffect, useCallback } from 'react';
import { customersApi, samplesApi, exhibitionsApi, expensesApi, fxRatesApi } from '../services/apiClient';

export type StorageMode = 'team' | 'local';

interface UseDataStoreOptions {
  storageMode: StorageMode;
}

// Generic hook for data management
export function useDataStore<T>(
  key: string,
  defaultData: T[],
  api: {
    getAll: () => Promise<T[]>;
    create: (data: any) => Promise<T>;
    update: (id: string, data: any) => Promise<T>;
    delete: (id: string) => Promise<void>;
  },
  options: UseDataStoreOptions
) {
  const [data, setData] = useState<T[]>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load data on mount or mode change
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        if (options.storageMode === 'team') {
          // Load from API (Supabase)
          const result = await api.getAll();
          setData(result);
        } else {
          // Load from localStorage
          const saved = localStorage.getItem(key);
          if (saved) {
            setData(JSON.parse(saved));
          }
        }
      } catch (err: any) {
        setError(err.message);
        console.error(`Error loading ${key}:`, err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [options.storageMode, key]);

  // Save to localStorage when in local mode
  useEffect(() => {
    if (options.storageMode === 'local') {
      localStorage.setItem(key, JSON.stringify(data));
    }
  }, [data, key, options.storageMode]);

  const create = useCallback(async (item: any) => {
    try {
      if (options.storageMode === 'team') {
        const result = await api.create(item);
        setData(prev => [result, ...prev]);
        return result;
      } else {
        const newItem = { ...item, id: `local_${Date.now()}` };
        setData(prev => [newItem, ...prev]);
        return newItem;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [options.storageMode, api]);

  const update = useCallback(async (id: string, updates: any) => {
    try {
      if (options.storageMode === 'team') {
        const result = await api.update(id, updates);
        setData(prev => prev.map(item => (item as any).id === id ? result : item));
        return result;
      } else {
        setData(prev => prev.map(item => (item as any).id === id ? { ...item, ...updates } : item));
        return updates;
      }
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [options.storageMode, api]);

  const remove = useCallback(async (id: string) => {
    try {
      if (options.storageMode === 'team') {
        await api.delete(id);
      }
      setData(prev => prev.filter(item => (item as any).id !== id));
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  }, [options.storageMode, api]);

  const setDataDirectly = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
    setData(newData);
  }, []);

  return {
    data,
    setData: setDataDirectly,
    create,
    update,
    remove,
    loading,
    error
  };
}
