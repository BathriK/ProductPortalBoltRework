import React, { useState, useEffect } from "react";
import { getPortfolios } from "../lib/data";
import { Portfolio, Product } from "../lib/types";
import ProductCard from "../components/ProductCard";
import Header from "../components/Header";
import { ChevronDown } from "lucide-react";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger 
} from "../components/ui/collapsible";
import ProductFilter from "@/components/ProductFilter";
import MonthYearSelector from "@/components/MonthYearSelector";
import { getCurrentMonthYear } from "@/lib/utils";

const Index: React.FC = () => {
  
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [expandedPortfolios, setExpandedPortfolios] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize with current month/year
  const { month, year } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(month);
  const [selectedYear, setSelectedYear] = useState<number>(year);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Index: Starting to fetch portfolios data');
        const data = await getPortfolios();
        console.log('Index: Received portfolios data:', {
          portfoliosCount: data.length,
          portfolios: data.map(p => ({
            id: p.id,
            name: p.name,
            productsCount: p.products.length,
            products: p.products.map(prod => ({
              id: prod.id,
              name: prod.name,
              metricsCount: prod.metrics?.length || 0,
              goalsCount: prod.releaseGoals?.length || 0,
              plansCount: prod.releasePlans?.length || 0
            }))
          }))
        });
        
        setPortfolios(data);
        console.log('Index: Updated portfolios state with data');
        
        // Initialize all portfolios as expanded
        const initialExpandedState: Record<string, boolean> = {};
        data.forEach(portfolio => {
          initialExpandedState[portfolio.id] = true;
        });
        setExpandedPortfolios(initialExpandedState);
        
        setLoading(false);
      } catch (error) {
        console.error("Index: Error loading portfolio data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Filter portfolios based on selected product
  const filteredPortfolios = selectedProductId
    ? portfolios.map(portfolio => {
        const hasSelectedProduct = portfolio.products.some(
          product => product.id === selectedProductId
        );

        if (hasSelectedProduct) {
          return {
            ...portfolio,
            products: portfolio.products.filter(product => product.id === selectedProductId)
          };
        }
        return null;
      }).filter(Boolean) as Portfolio[]
    : portfolios;

  console.log('Index: Render state:', {
    loading,
    portfoliosCount: portfolios.length,
    filteredPortfoliosCount: filteredPortfolios.length,
    selectedProductId,
    selectedMonth,
    selectedYear
  });

  // Dispatch filter change event for ProductCard components
  useEffect(() => {
    console.log(`Index: Dispatching filter change event for ${selectedMonth}/${selectedYear}`);
    const event = new CustomEvent('monthYearFilterChange', {
      detail: { month: selectedMonth, year: selectedYear }
    });
    window.dispatchEvent(event);
  }, [selectedMonth, selectedYear]);

  // Handle product filter change
  const handleProductChange = (productId: string) => {
    console.log('Index: Product filter changed to:', productId);
    setSelectedProductId(productId);
  };

  // Handle month/year filter changes
  const handleDateChange = (month: number, year: number) => {
    console.log(`Index: Month/year filter changed to ${month}/${year}`);
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Toggle portfolio expansion
  const togglePortfolio = (portfolioId: string) => {
    setExpandedPortfolios(prev => ({
      ...prev,
      [portfolioId]: !prev[portfolioId]
    }));
  };

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      {/* Main content without sidebar spacing */}
      <main className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-tnq-navy">Product Dashboard</h1>
          <div className="flex items-center gap-4">
            <div className="w-48">
              <MonthYearSelector
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onChange={handleDateChange}
                className="compact"
              />
            </div>
            <div className="w-64">
              <ProductFilter 
                selectedProductId={selectedProductId}
                onProductChange={handleProductChange}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading product data...</p>
            </div>
          </div>
        ) : filteredPortfolios.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm">
            <h2 className="text-xl text-gray-700 mb-4">No portfolios or products found</h2>
            <p className="text-gray-600 mb-6">
              Start by configuring your product portfolios in the configuration section.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {console.log('Index: Rendering portfolios:', {
              filteredPortfoliosCount: filteredPortfolios.length,
              portfolioDetails: filteredPortfolios.map(p => ({
                id: p.id,
                name: p.name,
                productsCount: p.products.length
              }))
            })}
            {/* Group products by portfolio */}
            {filteredPortfolios.map((portfolio) => (
              <div key={portfolio.id} className="bg-white rounded-lg p-4 shadow-sm">
                <Collapsible
                  open={expandedPortfolios[portfolio.id]}
                  onOpenChange={() => togglePortfolio(portfolio.id)}
                  className="w-full"
                >
                  <div className="border-b pb-2 mb-4">
                    <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                      <h2 className="text-xl font-medium text-gray-800">{portfolio.name}</h2>
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${
                        expandedPortfolios[portfolio.id] ? 'transform rotate-180' : ''
                      }`} />
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent>
                    <div className="space-y-6">
                      {portfolio.products.length === 0 ? (
                        <p className="text-gray-500 italic py-4">No products in this portfolio</p>
                      ) : (
                        portfolio.products.map((product) => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            selectedMonth={selectedMonth}
                            selectedYear={selectedYear}
                          />
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;