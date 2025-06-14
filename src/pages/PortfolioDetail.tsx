
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPortfolios } from "../lib/data";
import { Portfolio } from "../lib/types";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import Breadcrumbs from "../components/Breadcrumbs";
import { Button } from "../components/ui/button";

const PortfolioDetail: React.FC = () => {
  const { portfolioId } = useParams<{ portfolioId: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!portfolioId) {
      setError("Portfolio ID is missing");
      setLoading(false);
      return;
    }

    const fetchPortfolio = async () => {
      try {
        const portfolios = await getPortfolios();
        const found = portfolios.find(p => p.id === portfolioId);
        
        if (!found) {
          setError("Portfolio not found");
        } else {
          setPortfolio(found);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading portfolio:", err);
        setError("Failed to load portfolio data");
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [portfolioId]);

  // Breadcrumb items
  const breadcrumbItems = [
    { label: "Dashboard", href: "/" },
    { label: portfolio?.name || "Portfolio", isCurrent: true }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-tnq-lightgray">
        <Header />
        <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading portfolio data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="min-h-screen bg-tnq-lightgray">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <h2 className="text-xl text-red-600 mb-4">Error</h2>
            <p className="text-gray-700 mb-6">{error || "Failed to load portfolio data"}</p>
            <Button asChild>
              <Link to="/">
                Return to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs items={breadcrumbItems} />
        
        <div className="bg-white rounded-lg shadow-sm p-4 md:p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-semibold">{portfolio?.name} Portfolio</h1>
            <Button variant="secondary" asChild>
              <Link to="/config">
                Edit Portfolio
              </Link>
            </Button>
          </div>
          
          <p className="text-gray-600">
            {portfolio?.products.length} {portfolio?.products.length === 1 ? 'Product' : 'Products'} in this portfolio
          </p>
        </div>
        
        <h2 className="text-xl font-medium mb-6">Products</h2>
        
        {portfolio?.products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <p className="text-gray-600 mb-4">No products in this portfolio yet</p>
            <Button asChild>
              <Link to="/config">
                Add Products
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {portfolio?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PortfolioDetail;
