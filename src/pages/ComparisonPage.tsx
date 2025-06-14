import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { getAllProducts, getCurrentMonthData } from '../lib/data';
import { Product } from '../lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowUpCircle, ArrowDownCircle, CheckCircle, XCircle, AlertCircle, ExternalLink, GitCompare } from 'lucide-react';
import { getMonthName } from '../lib/utils';
import MonthYearSelector from '../components/MonthYearSelector';
import ProductFilter from '../components/ProductFilter';
import GoalsComparison from '../components/ComparisonViews/GoalsComparison';
import MetricsComparison from '../components/ComparisonViews/MetricsComparison';
import PlanComparison from '../components/ComparisonViews/PlanComparison';
import VersionComparison from '../components/VersionComparison';

const ComparisonPage = () => {
  const navigate = useNavigate();
  
  // State for comparison selections
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [period1Month, setPeriod1Month] = useState(new Date().getMonth() + 1);
  const [period1Year, setPeriod1Year] = useState(new Date().getFullYear());
  const [period2Month, setPeriod2Month] = useState(new Date().getMonth());
  const [period2Year, setPeriod2Year] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState('goals');
  const [comparisonMode, setComparisonMode] = useState<'period' | 'version'>('period');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Load products on component mount
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const allProducts = await getAllProducts();
        setProducts(allProducts);
        if (allProducts.length > 0 && !selectedProductId) {
          setSelectedProductId(allProducts[0].id);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadProducts();
  }, [selectedProductId]);

  // Get selected product data
  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId);
  }, [products, selectedProductId]);

  // Get data for both periods
  const period1Data = useMemo(() => {
    if (!selectedProduct) return null;
    
    const goals = selectedProduct.releaseGoals?.filter(g => 
      g.month === period1Month && g.year === period1Year
    ) || [];
    
    const plans = selectedProduct.releasePlans?.filter(p => 
      p.month === period1Month && p.year === period1Year
    ) || [];
    
    const metrics = selectedProduct.metrics?.filter(m => 
      m.month === period1Month && m.year === period1Year
    ) || [];

    return { goals, plans, metrics };
  }, [selectedProduct, period1Month, period1Year]);

  const period2Data = useMemo(() => {
    if (!selectedProduct) return null;
    
    const goals = selectedProduct.releaseGoals?.filter(g => 
      g.month === period2Month && g.year === period2Year
    ) || [];
    
    const plans = selectedProduct.releasePlans?.filter(p => 
      p.month === period2Month && p.year === period2Year
    ) || [];
    
    const metrics = selectedProduct.metrics?.filter(m => 
      m.month === period2Month && m.year === period2Year
    ) || [];

    return { goals, plans, metrics };
  }, [selectedProduct, period2Month, period2Year]);

  const handlePeriod1Change = (month: number, year: number) => {
    setPeriod1Month(month);
    setPeriod1Year(year);
  };

  const handlePeriod2Change = (month: number, year: number) => {
    setPeriod2Month(month);
    setPeriod2Year(year);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading products...</div>
          </div>
        </div>
      </div>
    );
  }

  const period1Label = `${getMonthName(period1Month)} ${period1Year}`;
  const period2Label = `${getMonthName(period2Month)} ${period2Year}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-tnq-navy mb-2">Product Comparison Dashboard</h1>
            <p className="text-gray-600">Compare release goals, plans, and metrics between different time periods or versions</p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            Back to Dashboard
          </Button>
        </div>

        {/* Comparison Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              Comparison Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Comparison Mode Toggle */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Comparison Mode</label>
                <div className="flex gap-2">
                  <Button 
                    variant={comparisonMode === 'period' ? 'default' : 'outline'}
                    onClick={() => setComparisonMode('period')}
                    size="sm"
                  >
                    Period Comparison
                  </Button>
                  <Button 
                    variant={comparisonMode === 'version' ? 'default' : 'outline'}
                    onClick={() => setComparisonMode('version')}
                    size="sm"
                  >
                    Version Comparison
                  </Button>
                </div>
              </div>

              {comparisonMode === 'period' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Product Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select Product</label>
                    <ProductFilter
                      selectedProductId={selectedProductId}
                      onProductChange={setSelectedProductId}
                      className="w-full"
                    />
                  </div>

                  {/* Period 1 Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Period 1</label>
                    <MonthYearSelector
                      selectedMonth={period1Month}
                      selectedYear={period1Year}
                      onChange={handlePeriod1Change}
                      className="w-full"
                    />
                  </div>

                  {/* Period 2 Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Period 2</label>
                    <MonthYearSelector
                      selectedMonth={period2Month}
                      selectedYear={period2Year}
                      onChange={handlePeriod2Change}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Selection */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Select Product</label>
                    <ProductFilter
                      selectedProductId={selectedProductId}
                      onProductChange={setSelectedProductId}
                      className="w-full"
                    />
                  </div>

                  {/* Period Selection for Version Comparison */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Period</label>
                    <MonthYearSelector
                      selectedMonth={period1Month}
                      selectedYear={period1Year}
                      onChange={handlePeriod1Change}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Comparison Content */}
        {selectedProduct ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedProduct.name} - {comparisonMode === 'period' 
                  ? `${period1Label} vs ${period2Label}` 
                  : `${getMonthName(period1Month)} ${period1Year} Version Comparison`
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="goals">Release Goals</TabsTrigger>
                  <TabsTrigger value="plans">Release Plans</TabsTrigger>
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="mt-6">
                  {comparisonMode === 'period' ? (
                    <GoalsComparison
                      currentGoals={period1Data?.goals[0]?.goals || []}
                      previousGoals={period2Data?.goals[0]?.goals || []}
                      currentPeriod={period1Label}
                      previousPeriod={period2Label}
                    />
                  ) : (
                    <VersionComparison
                      product={selectedProduct}
                      selectedMonth={period1Month}
                      selectedYear={period1Year}
                      comparisonType="goals"
                    />
                  )}
                </TabsContent>

                <TabsContent value="plans" className="mt-6">
                  {comparisonMode === 'period' ? (
                    <PlanComparison
                      currentPlan={period1Data?.plans[0]?.items || []}
                      previousPlan={period2Data?.plans[0]?.items || []}
                      currentPeriod={period1Label}
                      previousPeriod={period2Label}
                    />
                  ) : (
                    <VersionComparison
                      product={selectedProduct}
                      selectedMonth={period1Month}
                      selectedYear={period1Year}
                      comparisonType="plans"
                    />
                  )}
                </TabsContent>

                <TabsContent value="metrics" className="mt-6">
                  {comparisonMode === 'period' ? (
                    <MetricsComparison
                      currentMetrics={period1Data?.metrics || []}
                      previousMetrics={period2Data?.metrics || []}
                      currentPeriod={period1Label}
                      previousPeriod={period2Label}
                    />
                  ) : (
                    <VersionComparison
                      product={selectedProduct}
                      selectedMonth={period1Month}
                      selectedYear={period1Year}
                      comparisonType="metrics"
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <GitCompare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Product Selected
              </h3>
              <p className="text-gray-500">
                Please select a product to start comparing.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ComparisonPage;
