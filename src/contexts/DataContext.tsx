
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Portfolio, Product } from '../lib/types';
import { getPortfolios } from '../lib/data';

interface DataContextType {
  portfolios: Portfolio[];
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  getProductById: (id: string) => { product: Product | null; portfolio: Portfolio | null };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('DataContext: Refreshing portfolio and product data...');

      const portfoliosData = await getPortfolios();
      console.log('DataContext: Loaded portfolios:', portfoliosData.length);

      setPortfolios(portfoliosData);
      
      // Flatten all products for easy access
      const allProducts: Product[] = [];
      portfoliosData.forEach(portfolio => {
        allProducts.push(...portfolio.products);
      });
      setProducts(allProducts);

      console.log('DataContext: Loaded products:', allProducts.length);
    } catch (err) {
      console.error('DataContext: Error loading data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (id: string): { product: Product | null; portfolio: Portfolio | null } => {
    for (const portfolio of portfolios) {
      const product = portfolio.products.find(p => p.id === id);
      if (product) {
        return { product, portfolio };
      }
    }
    return { product: null, portfolio: null };
  };

  // Initial data load
  useEffect(() => {
    refreshData();
  }, []);

  // Listen for data update events
  useEffect(() => {
    const handleDataUpdate = () => {
      console.log('DataContext: Data update event received, refreshing...');
      refreshData();
    };

    window.addEventListener('productDataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('productDataUpdated', handleDataUpdate);
    };
  }, []);

  const value: DataContextType = {
    portfolios,
    products,
    loading,
    error,
    refreshData,
    getProductById
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
