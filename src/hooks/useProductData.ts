
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { findProductById } from '../lib/data';
import { Product, Portfolio } from '../lib/types';

export function useProductData(productId: string | undefined) {
  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterMonth, setFilterMonth] = useState<number | null>(null);
  const [filterYear, setFilterYear] = useState<number | null>(null);
  const navigate = useNavigate();

  // Listen for month/year filter changes from header
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { month, year } = event.detail;
      console.log('useProductData: Received filter change:', month, year);
      setFilterMonth(month);
      setFilterYear(year);
    };

    window.addEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!productId) return;

    const fetchProductData = async () => {
      try {
        console.log('useProductData: Fetching data for product:', productId);
        const result = await findProductById(productId);
        const foundProduct = result.product;
        const foundPortfolio = result.portfolio;
        
        if (!foundProduct || !foundPortfolio) {
          console.log('useProductData: Product or portfolio not found, redirecting');
          navigate("/");
          return;
        }

        // Log all available data for debugging
        console.log('useProductData: Full product data loaded:', {
          productName: foundProduct.name,
          totalMetrics: foundProduct.metrics.length,
          totalGoals: foundProduct.releaseGoals.length,
          totalPlans: foundProduct.releasePlans.length,
          totalNotes: foundProduct.releaseNotes.length,
          allMetricMonths: foundProduct.metrics.map(m => `${m.month}/${m.year}`),
          allGoalMonths: foundProduct.releaseGoals.map(g => `${g.month}/${g.year}`),
          allPlanMonths: foundProduct.releasePlans.map(p => `${p.month}/${p.year}`),
          allNoteMonths: foundProduct.releaseNotes.map(n => `${n.month}/${n.year}`)
        });

        // Apply month/year filter only if explicitly set
        let filteredProduct = foundProduct;
        if (filterMonth !== null && filterYear !== null) {
          console.log('useProductData: Applying filter for:', filterMonth, filterYear);
          filteredProduct = {
            ...foundProduct,
            metrics: foundProduct.metrics.filter(m => m.month === filterMonth && m.year === filterYear),
            releaseGoals: foundProduct.releaseGoals.filter(g => g.month === filterMonth && g.year === filterYear),
            releasePlans: foundProduct.releasePlans.filter(p => p.month === filterMonth && p.year === filterYear),
            releaseNotes: foundProduct.releaseNotes.filter(n => n.month === filterMonth && n.year === filterYear)
          };
          console.log('useProductData: Filtered data:', {
            metrics: filteredProduct.metrics.length,
            goals: filteredProduct.releaseGoals.length,
            plans: filteredProduct.releasePlans.length,
            notes: filteredProduct.releaseNotes.length
          });
        } else {
          console.log('useProductData: No filter applied, showing all data');
        }

        setProduct(filteredProduct);
        setPortfolio(foundPortfolio);
        setLoading(false);
      } catch (error) {
        console.error("useProductData: Error loading product:", error);
        navigate("/");
      }
    };

    fetchProductData();
  }, [productId, navigate, filterMonth, filterYear]);

  return { product, setProduct, portfolio, setPortfolio, loading, setLoading };
}
