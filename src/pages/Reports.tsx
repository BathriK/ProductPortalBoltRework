
import React, { useState, useEffect } from "react";
import { getPortfolios, findProductById } from "../lib/data";
import { Portfolio, Product } from "../lib/types";
import Header from "../components/Header";
import { Heading } from "@/components/ui/heading";
import GlobalFilterBar from "@/components/GlobalFilterBar";
import GoalsTable from "@/components/GoalsTable";
import { Card } from "@/components/ui/card";

const Reports: React.FC = () => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | undefined>(undefined);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getPortfolios();
        setPortfolios(data);
        
        // Default to first product if available
        if (data.length > 0 && data[0].products.length > 0) {
          setSelectedProductId(data[0].products[0].id);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading portfolio data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch product details when product ID changes
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!selectedProductId) {
        setSelectedProduct(null);
        return;
      }

      try {
        setLoading(true);
        const result = await findProductById(selectedProductId);
        if (result && result.product) {
          setSelectedProduct(result.product);
        } else {
          setSelectedProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
        setSelectedProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [selectedProductId]);

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <Heading>Reports</Heading>
        
        <GlobalFilterBar
          selectedProductId={selectedProductId}
          onProductChange={handleProductChange}
          showDateFilter={false}
        />
        
        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : !selectedProduct ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Please select a product to view its reports</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-medium mb-6 text-tnq-navy">
                {selectedProduct.name} - Product Reports
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-700">Release Goals</h3>
                  {selectedProduct.releaseGoals && selectedProduct.releaseGoals.length > 0 ? (
                    <GoalsTable goals={selectedProduct.releaseGoals[0].goals || []} />
                  ) : (
                    <p className="text-gray-500 italic">No release goals available</p>
                  )}
                </Card>
                
                <Card className="p-4">
                  <h3 className="text-lg font-medium mb-4 text-gray-700">Release Plan</h3>
                  {selectedProduct.releasePlans && selectedProduct.releasePlans.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feature</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedProduct.releasePlans[0].items?.map((feature, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{feature.title}</td>
                              <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-700">{feature.category}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No release plan available</p>
                  )}
                </Card>
              </div>
              
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4 text-gray-700">Key Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedProduct.metrics?.slice(0, 3).map((metric, index) => (
                    <Card key={index} className="p-4 text-center">
                      <h4 className="font-medium text-gray-600 mb-2">{metric.name}</h4>
                      <p className="text-2xl font-semibold text-tnq-navy">{metric.value}</p>
                      <p className="text-sm text-gray-500">
                        {metric.monthlyTarget ? `Monthly Target: ${metric.monthlyTarget}` : 'No monthly target set'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {metric.annualTarget ? `Annual Target: ${metric.annualTarget}` : 'No annual target set'}
                      </p>
                    </Card>
                  ))}
                </div>
                {(!selectedProduct.metrics || selectedProduct.metrics.length === 0) && (
                  <p className="text-gray-500 italic">No metrics available</p>
                )}
              </div>
              
              <div className="mt-8">
                <h2 className="text-xl font-medium mb-4">Custom Reports</h2>
                <p className="text-gray-600 mb-4">
                  Custom reports are currently in development. Please check back later.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Reports;
