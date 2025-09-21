'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  subcategories?: string[];
  isActive: boolean;
  productCount?: number;
}

interface UseAdminCategoriesReturn {
  categories: AdminCategory[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminCategories(): UseAdminCategoriesReturn {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all categories (including inactive ones) for admin  
      const response = await apiClient.getCategories();
      
      if (response.success) {
        setCategories(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch categories');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}