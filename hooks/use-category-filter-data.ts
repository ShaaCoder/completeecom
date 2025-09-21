'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';
import { Product } from '@/types';

interface UseCategoryFilterDataParams {
  categoryId?: string;
}

interface UseCategoryFilterDataReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
}

/**
 * Separate hook for fetching products data for category filters
 * This avoids conflicts with the main useProducts hook
 */
export function useCategoryFilterData(params: UseCategoryFilterDataParams = {}): UseCategoryFilterDataReturn {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFilterData = async () => {
      if (!params.categoryId) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiClient.getProducts({
          category: params.categoryId,
          limit: 100, // Get enough products to show filter options
          page: 1
        });
        
        if (response.success) {
          setProducts(response.data || []);
        } else {
          setError(response.message || 'Failed to fetch filter data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch filter data');
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [params.categoryId]);

  return {
    products,
    loading,
    error,
  };
}