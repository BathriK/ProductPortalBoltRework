
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { SearchResult } from '../lib/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SearchResults = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [query, setQuery] = useState<string>('');
  
  useEffect(() => {
    if (location.state?.results && location.state?.query) {
      setResults(location.state.results);
      setQuery(location.state.query);
    } else {
      // If no results, redirect to home
      navigate('/');
    }
  }, [location.state, navigate]);

  const handleResultClick = (result: SearchResult) => {
    if (result.type === 'product') {
      // Determine the appropriate tab based on the match field
      let tab = "roadmap"; // default tab
      
      if (result.matchField === 'Goal' || result.matchField === 'goals') {
        tab = "goals";
      } else if (result.matchField === 'Plan' || result.matchField === 'plan') {
        tab = "plan";
      } else if (result.matchField === 'Note' || result.matchField === 'notes') {
        tab = "notes";
      } else if (result.matchField === 'Metric' || result.matchField === 'metric') {
        tab = "metrics";
      }
      
      navigate(`/products/${result.id}`, { state: { activeTab: tab } });
    } else if (result.type === 'portfolio') {
      navigate(`/portfolios/${result.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center space-x-1"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </Button>
            <h1 className="text-2xl font-semibold">Search Results</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-medium text-tnq-purple mb-4">Results for: "{query}"</h2>
          
          {results.length > 0 ? (
            <div className="space-y-6">
              {results.map((result, index) => (
                <div key={`${result.id}-${index}`} className="bg-gray-50 p-4 rounded-md border border-gray-200 hover:shadow-md transition-shadow">
                  <div 
                    className="cursor-pointer" 
                    onClick={() => handleResultClick(result)}
                  >
                    <h3 className="text-lg font-medium text-tnq-blue hover:underline">
                      {result.name} 
                      <span className="ml-2 text-sm bg-gray-200 px-2 py-1 rounded-full">
                        {result.type}
                      </span>
                    </h3>
                    
                    {result.portfolioName && result.type === 'product' && (
                      <p className="text-sm text-gray-500 mb-2">
                        Portfolio: {result.portfolioName}
                      </p>
                    )}
                    
                    <div className="text-sm mt-2">
                      <span className="font-semibold">{result.matchField}:</span> {result.matchValue}
                    </div>
                    
                    {result.semanticScore !== undefined && result.semanticText && (
                      <div className="mt-3 text-gray-700 border-t border-gray-200 pt-2">
                        {result.semanticText}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SearchResults;
