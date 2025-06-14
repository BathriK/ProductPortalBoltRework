// src/components/ProductCard.tsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Product } from '../lib/types';
import { getCurrentMonthData, getPreviousMonthData } from "../lib/data";
import { getPreviousMonthYear } from "../lib/utils";
import { Eye, Pencil, Target } from 'lucide-react';
import MetricsDisplay from './MetricsDisplay';
import { Card, CardContent } from './ui/card';
import ReleaseGoalsCard from './ReleaseGoalsCard';
import ReleasePlanCard from './ReleasePlanCard';
import ProductMetricsHelper from './ProductMetricsHelper';
import DummyDataHelper from './DummyDataHelper';
import { Button } from './ui/button';
import { usePermissions } from '../contexts/AuthContext';
import { getLatestVersionedItem } from '@/lib/utils';
import { hasProductObjectives } from '@/services/okrService';

interface ProductCardProps {
  product: Product;
  selectedMonth?: number;
  selectedYear?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  selectedMonth: propSelectedMonth, 
  selectedYear: propSelectedYear 
}) => {
  const navigate = useNavigate();
  const [productState, setProductState] = useState<Product>(product);
  const [filterMonth, setFilterMonth] = useState<number | null>(propSelectedMonth || null);
  const [filterYear, setFilterYear] = useState<number | null>(propSelectedYear || null);
  const { canEdit } = usePermissions();
  const [hasOKRs, setHasOKRs] = useState<boolean>(false); // New state for OKRs

  console.log('ProductCard: Initializing for product:', product.name, {
    propSelectedMonth,
    propSelectedYear,
    productMetrics: product.metrics?.length || 0,
    productGoals: product.releaseGoals?.length || 0,
    productPlans: product.releasePlans?.length || 0
  });

  // Update filter when props change
  useEffect(() => {
    if (propSelectedMonth && propSelectedYear) {
      console.log('ProductCard: Props changed for', product.name, 'to', propSelectedMonth, propSelectedYear);
      setFilterMonth(propSelectedMonth);
      setFilterYear(propSelectedYear);
    }
  }, [propSelectedMonth, propSelectedYear, product.name]);

  // Listen for month/year filter changes from header
  useEffect(() => {
    const handleFilterChange = (event: CustomEvent) => {
      const { month, year } = event.detail;
      console.log('ProductCard: Received filter change event for', product.name, ':', month, year);
      setFilterMonth(month);
      setFilterYear(year);
    };

    window.addEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    
    return () => {
      window.removeEventListener('monthYearFilterChange', handleFilterChange as EventListener);
    };
  }, [product.name]);

  // Reload product data from localStorage to ensure we have the latest
  useEffect(() => {
    const reloadProductData = () => {
      try {
        const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]');
        console.log('ProductCard: Reloading product data from localStorage for', product.name);
        
        for (const portfolio of portfolios) {
          const foundProduct = portfolio.products?.find((p: Product) => p.id === product.id);
          if (foundProduct) {
            console.log('ProductCard: Found updated product data for', product.name, ':', {
              metrics: foundProduct.metrics?.length || 0,
              goals: foundProduct.releaseGoals?.length || 0,
              plans: foundProduct.releasePlans?.length || 0,
              notes: foundProduct.releaseNotes?.length || 0
            });
            setProductState(foundProduct);
            break;
          }
        }
      } catch (error) {
        console.error('ProductCard: Error reloading product data for', product.name, ':', error);
      }
    };

    // Reload on mount and when product id changes
    reloadProductData();

    // Listen for storage changes (when data is saved from edit page)
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'portfolios') {
        console.log('ProductCard: Storage changed, reloading data for', product.name);
        reloadProductData();
      }
    };

    // Listen for custom storage events
    const handleCustomStorageChange = () => {
      console.log('ProductCard: Custom storage event received, reloading data for', product.name);
      reloadProductData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('productDataUpdated', handleCustomStorageChange as EventListener);
    window.addEventListener('okrDataUpdated', handleCustomStorageChange as EventListener);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('productDataUpdated', handleCustomStorageChange as EventListener);
      window.removeEventListener('okrDataUpdated', handleCustomStorageChange as EventListener);
    };
  }, [product.id, product.name]);

  // Check for OKRs when productState changes
  useEffect(() => {
    const checkOKRs = async () => {
      const hasObjectives = hasProductObjectives(productState.id);
      setHasOKRs(hasObjectives);
    };
    checkOKRs();
  }, [productState.id]);

  // Get current month data for filtering - fallback to April 2025 if no filter set
  const currentMonth = filterMonth || 4;
  const currentYear = filterYear || 2025;

  console.log('ProductCard: Using filter for', product.name, '- month:', currentMonth, 'year:', currentYear);

  // Filter metrics for display
  const latestMetrics = React.useMemo(() => {
    // Filter Metric parent objects for the current month and year
    const metricsForPeriod = productState.metrics?.filter(m =>
      m.month === currentMonth && m.year === currentYear
    ) || [];

    // Get the single latest version of the Metric parent object for this period
    const latestMetricParent = getLatestVersionedItem(metricsForPeriod);

    // If a latest metric parent is found, return it as an array, otherwise an empty array
    return latestMetricParent ? [latestMetricParent] : [];
  }, [productState.metrics, currentMonth, currentYear]);

  console.log('ProductCard: Filtered metrics for', product.name, 'in', currentMonth, currentYear, ':', latestMetrics.length);

  // Create filtered product for other components
  const displayProduct = {
    ...productState,
    metrics: latestMetrics,
    releaseGoals: productState.releaseGoals?.filter(g => 
      g.month === currentMonth && g.year === currentYear
    ) || [],
    releasePlans: productState.releasePlans?.filter(p => 
      p.month === currentMonth && p.year === currentYear
    ) || []
  };

  // Get previous month data for release notes
  const { month: prevMonth, year: prevYear } = getPreviousMonthYear();
  const prevMonthReleaseNotes = productState.releaseNotes?.filter(n => 
    n.month === prevMonth && n.year === prevYear
  ) || [];

  // Add previous month's release notes to display product
  displayProduct.releaseNotes = prevMonthReleaseNotes;

  console.log('ProductCard: Display product data for', product.name, ':', {
    metrics: displayProduct.metrics.length,
    goals: displayProduct.releaseGoals.length,
    plans: displayProduct.releasePlans.length,
    notes: displayProduct.releaseNotes.length
  });

  // Get latest data for this product (using filtered data)
  const { latestRoadmap, latestReleaseGoal, latestReleasePlan } = getCurrentMonthData(displayProduct);

  // Get previous month data for release notes
  const { latestReleaseNote } = getPreviousMonthData(displayProduct);

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/products/${productState.id}/edit`);
  };

  console.log('ProductCard: Rendering', product.name, 'with filtered data - metrics:', latestMetrics.length);

  // These helper components don't render anything, but update the product data if needed
  return (
    <>
      <ProductMetricsHelper product={productState} />
      <DummyDataHelper product={productState} latestReleaseGoal={latestReleaseGoal} latestReleasePlan={latestReleasePlan} />
      
      <Card className="animate-fade-in mb-4 w-full">
        <CardContent className="grid-spacing">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <h3 className="font-semibold text-tnq-blue">{productState.name}</h3>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="View product details" asChild>
                  <Link to={`/products/${productState.id}`}>
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Link>
                </Button>
                {canEdit && (
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-tnq-green hover:text-tnq-green-dark" onClick={handleEditClick} aria-label="Edit product">
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Product links section */}
            <div className="flex flex-col gap-2">
              {latestRoadmap && latestRoadmap.link && (
                <a href={latestRoadmap.link} target="_blank" rel="noopener noreferrer" className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                  View Roadmap v{latestRoadmap.version}
                </a>
              )}
              
              {latestReleaseNote && latestReleaseNote.link && (
                <a href={latestReleaseNote.link} target="_blank" rel="noopener noreferrer" className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                  View Release Notes v{latestReleaseNote.version}
                </a>
              )}

              {hasOKRs && (
                <Link to={`/annual-okrs?product=${productState.id}`} className="text-sm text-tnq-blue hover:text-tnq-navyBlue hover:underline flex items-center">
                  <Target className="h-4 w-4 mr-1" /> View OKRs
                </Link>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 text-left">
                Product Metrics ({currentMonth}/{currentYear})
              </h4>
              {latestMetrics.length > 0 && (
                <span className="text-xs text-white bg-tnq-blue px-2 py-0.5 rounded-full">
                  v{latestMetrics[0].version || '1.0'}
                </span>
              )}
            </div>
            {latestMetrics.length > 0 ? (
              <MetricsDisplay metrics={latestMetrics} />
            ) : (
              <div className="text-sm text-gray-500 italic py-2">
                No metrics available for {currentMonth}/{currentYear}
                {productState.metrics && productState.metrics.length > 0 && (
                  <div className="mt-1 text-xs">
                    Available periods: {Array.from(new Set(productState.metrics.map(m => `${m.month}/${m.year}`))).join(', ')}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="grid-container">
            {/* Release goals section */}
            <div className="w-full">
              <ReleaseGoalsCard productId={productState.id} latestReleaseGoal={latestReleaseGoal || displayProduct.releaseGoals?.[0]} />
            </div>
            
            {/* Release plan section */}
            <div className="w-full">
              <ReleasePlanCard productId={productState.id} latestReleasePlan={latestReleasePlan || displayProduct.releasePlans?.[0]} />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ProductCard;
