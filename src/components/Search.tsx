import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPortfolios } from '../lib/data';
import { searchPortfolios } from '../lib/utils';
import { SearchResult, Portfolio } from '../lib/types';
import { initializeVectorStore, semanticSearch, isInitialized } from '../lib/semanticSearch';
import { setOpenAIKey } from '../lib/embeddings';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Search as SearchIcon } from 'lucide-react';

export const Search: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [isSemanticReady, setIsSemanticReady] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [isAIEnabled, setIsAIEnabled] = useState<boolean>(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Load portfolios once on component mount
  useEffect(() => {
    const loadPortfolios = async () => {
      try {
        const data = await getPortfolios();
        setPortfolios(data);
        
        // Check if vector store is already initialized
        if (!isInitialized()) {
          console.log("Initializing vector store...");
          try {
            await initializeVectorStore(data);
            setIsSemanticReady(true);
            setIsAIEnabled(true);
            toast({
              title: "AI Search Ready",
              description: "Try asking questions like 'What are the goals for product X?'",
            });
          } catch (error) {
            console.error("Failed to initialize semantic search:", error);
            toast({
              title: "Search Initialization Error",
              description: "Fallback to basic search has been enabled",
              variant: "destructive",
            });
          }
        } else {
          setIsSemanticReady(true);
          setIsAIEnabled(true);
        }
      } catch (error) {
        console.error("Error loading portfolios:", error);
        toast({
          title: "Error Loading Data",
          description: "Could not load portfolio data for search",
          variant: "destructive",
        });
      }
    };
    
    loadPortfolios();
  }, []);

  // Handle API key submission
  const handleApiKeySubmit = async () => {
    if (apiKey) {
      setLoading(true);
      setOpenAIKey(apiKey);
      setShowApiKeyInput(false);
      
      try {
        await initializeVectorStore(portfolios);
        setIsSemanticReady(true);
        setIsAIEnabled(true);
        toast({
          title: "AI Search Enabled",
          description: "Using OpenAI for enhanced semantic search",
        });
      } catch (error) {
        console.error("Failed to initialize vector store with API key:", error);
        toast({
          title: "Error",
          description: "Failed to initialize semantic search",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  // Determine if the query looks like a natural language question
  const isNaturalLanguageQuery = (q: string): boolean => {
    const questionWords = ['what', 'who', 'when', 'where', 'which', 'why', 'how', 'can', 'does', 'is', 'are'];
    const lowerQuery = q.toLowerCase().trim();
    
    // Check if it starts with a question word
    const startsWithQuestionWord = questionWords.some(word => 
      lowerQuery.startsWith(`${word} `) || lowerQuery.startsWith(`${word}'s `)
    );
    
    // Check if it ends with a question mark
    const endsWithQuestionMark = lowerQuery.endsWith('?');
    
    // Check if it contains certain phrases that indicate a question
    const containsQuestionPattern = /tell me|show me|find|search for|looking for/.test(lowerQuery);
    
    return startsWithQuestionWord || endsWithQuestionMark || containsQuestionPattern;
  };

  // Handle search - improved to ensure results appear
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      try {
        // Always start with a basic search to ensure we have results
        const basicSearchResults = searchPortfolios(portfolios, query);
        
        // Check if query looks like a natural language question and semantic search is ready
        if (isSemanticReady && isAIEnabled && isNaturalLanguageQuery(query)) {
          try {
            const semanticResults = await semanticSearch(query);
            if (semanticResults && semanticResults.length > 0) {
              setResults(semanticResults);
            } else {
              // Fall back to basic search if semantic search returns no results
              setResults(basicSearchResults);
            }
          } catch (error) {
            console.error("Semantic search failed:", error);
            // Fall back to basic search on error
            setResults(basicSearchResults);
          }
        } else {
          // Use basic search for non-question queries
          setResults(basicSearchResults);
        }
        
        // Force the search results to be visible
        if (query.trim().length >= 2) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Search error:", error);
        toast({
          title: "Search Error",
          description: "An error occurred while searching. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    // Use a smaller delay to make search more responsive
    const timeoutId = setTimeout(() => {
      performSearch();
    }, 200);
    
    return () => clearTimeout(timeoutId);
  }, [query, portfolios, isSemanticReady, isAIEnabled]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle keyboard navigation for search results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && results.length > 0) {
      // Navigate to search results page on Enter
      navigateToSearchResults();
    }
  };

  // Navigate to detailed search results page
  const navigateToSearchResults = () => {
    setIsOpen(false);
    if (results.length > 0) {
      navigate('/search-results', { state: { results, query } });
    } else {
      // Show a message if no results
      toast({
        title: "No Results",
        description: `No items found matching "${query}"`,
      });
    }
  };

  // Handle selection of a search result
  const handleResultClick = (result: SearchResult) => {
    setQuery('');
    setIsOpen(false);
    
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

  const toggleAISearch = () => {
    if (isAIEnabled) {
      setIsAIEnabled(false);
      toast({
        title: "AI Search Disabled",
        description: "Using basic keyword search only",
      });
    } else {
      if (isSemanticReady) {
        setIsAIEnabled(true);
        toast({
          title: "AI Search Enabled",
          description: "Using semantic search for natural language queries",
        });
      } else {
        setShowApiKeyInput(true);
      }
    }
  };

  return (
    <div className="relative" ref={searchRef}>
      {showApiKeyInput && (
        <div className="absolute -top-16 left-0 w-full bg-white p-3 rounded-md shadow-lg border border-gray-200 z-50">
          <div className="mb-2 text-sm">Enter OpenAI API key to enable AI search:</div>
          <div className="flex space-x-2">
            <input
              type="password"
              className="flex-1 px-3 py-1 border rounded-md"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button 
              onClick={handleApiKeySubmit}
              disabled={loading}
              className="bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button 
              onClick={() => setShowApiKeyInput(false)}
              className="bg-gray-300 px-3 py-1 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      <div className="relative">
        <div className="flex items-center">
          <div className="relative flex-1">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-full pl-10 focus:outline-none focus:ring-2 focus:ring-tnq-blue focus:border-transparent"
              placeholder={isAIEnabled ? "Search or ask a question..." : "Search products, portfolios..."}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setIsOpen(true);
                }
              }}
              onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon
                className="h-5 w-5 text-gray-400"
              />
            </div>
            {loading && (
              <div className="absolute inset-y-0 right-10 flex items-center">
                <div className="w-4 h-4 border-2 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              </div>
            )}
            {query && (
              <button
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setIsOpen(false);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-400 hover:text-gray-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          
          <button 
            onClick={toggleAISearch}
            className={`ml-2 p-2 rounded-full ${isAIEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'} hover:bg-opacity-80`}
            title={isAIEnabled ? "AI Search Enabled" : "Enable AI Search"}
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg max-h-80 overflow-auto z-50">
            <ul className="py-1 text-sm">
              {results.slice(0, 5).map((result, index) => (
                <li
                  key={`${result.id}-${index}`}
                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => handleResultClick(result)}
                >
                  <div className="font-medium">{result.name}</div>
                  <div className="text-xs text-gray-500">
                    {result.type === 'product' && result.portfolioName
                      ? `${result.portfolioName} > ${result.matchField}: ${result.matchValue}`
                      : `Portfolio > ${result.matchField}: ${result.matchValue}`}
                  </div>
                  {/* Show semantic match if available */}
                  {result.semanticScore !== undefined && result.semanticText && (
                    <div className="text-xs mt-1 text-gray-600 italic">
                      {result.semanticText.length > 120 
                        ? result.semanticText.substring(0, 120) + '...' 
                        : result.semanticText}
                    </div>
                  )}
                </li>
              ))}
              
              {results.length > 5 && (
                <li 
                  className="px-4 py-3 text-center text-blue-600 hover:bg-gray-100 cursor-pointer font-medium"
                  onClick={navigateToSearchResults}
                >
                  View all {results.length} results
                </li>
              )}
            </ul>
          </div>
        )}
        
        {isOpen && query.trim().length >= 2 && results.length === 0 && !loading && (
          <div className="absolute mt-1 w-full bg-white rounded-md shadow-lg z-50">
            <div className="py-4 px-4 text-center text-sm text-gray-500">
              No results found for "{query}"
            </div>
          </div>
        )}
      </div>
    </div>
  );
};