// src/pages/ProductPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { findProductById } from '../lib/data';
import { Button } from '@/components/ui/button';
import Header from '../components/Header';
import { ArrowLeft, Download } from 'lucide-react';
import MetricsDisplay from '../components/MetricsDisplay';
import GoalsTable from '../components/GoalsTable';
import VersionHistory from '../components/VersionHistory';
import MonthYearSelector from '../components/MonthYearSelector';
import { Product, Roadmap, ReleaseGoal, ReleasePlan, GoalItem, ReleasePlanItem, Metric } from '../lib/types';
import { exportProductXML } from '../lib/xmlUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, getLatestVersionedItem } from '@/lib/utils';
import ReleaseNotesTable from '../components/ReleaseNotesTable';
import { usePermissions } from '@/contexts/AuthContext';
import ProductDetailHeader from '../components/ProductDetailHeader';
import ReleasePlanTable from '../components/ReleasePlanTable';

const ProductDetail = () => {
  const {
    productId
  } = useParams<{
    productId: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Immediately redirect to edit page if that's what we want
  useEffect(() => {
    if (location.state?.editMode) {
      navigate(`/products/${productId}/edit`);
    }
  }, [location.state, productId, navigate]);

  const [product, setProduct] = useState<Product | null>(null);
  const [portfolio, setPortfolio] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [productLoading, setProductLoading] = useState<boolean>(true);

  // Initialize with active tab from URL search param or default to "roadmap"
  const getInitialTab = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || location.state?.activeTab || "roadmap";
  };
  const [activeTab, setActiveTab] = useState<string>(getInitialTab());

  // Current selected time period
  const getCurrentMonthYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
    const currentYear = now.getFullYear();

    // Check if current date is within the April 2025 - March 2026 range
    if (currentYear === 2025 && currentMonth >= 4 || currentYear === 2026 && currentMonth <= 3) {
      // Current date is within range, use it
      return {
        month: currentMonth,
        year: currentYear
      };
    } else if (currentYear < 2025 || currentYear === 2025 && currentMonth < 4) {
      // Current date is before range, use April 2025
      return {
        month: 4,
        year: 2025
      };
    } else {
      // Current date is after range, use March 2026
      return {
        month: 3,
        year: 2026
      };
    }
  };
  const {
    month,
    year
  } = getCurrentMonthYear();
  const [selectedMonth, setSelectedMonth] = useState<number>(month);
  const [selectedYear, setSelectedYear] = useState<number>(year);

  // Version data
  const [latestRoadmap, setLatestRoadmap] = useState<Roadmap | null>(null);
  const [latestReleaseGoal, setLatestReleaseGoal] = useState<ReleaseGoal | null>(null);
  const [latestReleasePlan, setLatestReleasePlan] = useState<ReleasePlan | null>(null);

  // Version history data
  const [roadmapVersions, setRoadmapVersions] = useState<Roadmap[]>([]);
  const [releaseGoalVersions, setReleaseGoalVersions] = useState<ReleaseGoal[]>([]);
  const [releasePlanVersions, setReleasePlanVersions] = useState<ReleasePlan[]>([]);

  // Selected version IDs
  const [selectedRoadmapId, setSelectedRoadmapId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Release notes link
  const [releaseNotesLink, setReleaseNotesLink] = useState<string | null>(null);

  // Function to fetch fresh product data from localStorage
  const fetchFreshProductData = async () => {
    if (!productId) return null;
    
    try {
      // Always fetch fresh data from localStorage
      const result = await findProductById(productId);
      return result;
    } catch (error) {
      console.error("Error fetching fresh product data:", error);
      return null;
    }
  };

  // Update URL when tab changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', activeTab);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  }, [activeTab, location.pathname, navigate]);

  useEffect(() => {
    if (!productId) {
      navigate("/");
      return;
    }
    setProductLoading(true);
    const fetchProductData = async () => {
      try {
        const result = await fetchFreshProductData();
        const foundProduct = result?.product;
        const foundPortfolio = result?.portfolio;
        if (!foundProduct) {
          navigate("/");
          return;
        }
        
        console.log('ProductDetail: Loaded fresh product data:', foundProduct.name);
        setProduct(foundProduct);
        setPortfolio(foundPortfolio ? {
          id: foundPortfolio.id,
          name: foundPortfolio.name
        } : null);

        // Load all versions for each data type
        loadVersions(foundProduct);

        // Set release notes link if available in the product data
        const matchingReleaseNotes = foundProduct.releaseNotes.find(note => note.month === selectedMonth && note.year === selectedYear);
        if (matchingReleaseNotes && matchingReleaseNotes.link) {
          setReleaseNotesLink(matchingReleaseNotes.link);
        } else {
          setReleaseNotesLink(null);
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setProductLoading(false);
      }
    };
    fetchProductData();
  }, [productId, navigate]);

  // Load versions based on selected month/year
  useEffect(() => {
    if (!product) return;

    // Update versions when month/year changes
    loadVersions(product);
  }, [selectedMonth, selectedYear, product]);

  const loadVersions = (product: Product) => {
    // For roadmap, filter by year only
    const roadmaps = product.roadmap.filter(r => r.year === selectedYear);
    setRoadmapVersions(roadmaps);

    // For other data types, filter by month and year
    const goals = product.releaseGoals.filter(g => g.month === selectedMonth && g.year === selectedYear);
    const plans = product.releasePlans.filter(p => p.month === selectedMonth && p.year === selectedYear);
    setReleaseGoalVersions(goals);
    setReleasePlanVersions(plans);

    // Set latest versions using getLatestVersionedItem
    const latestRoadmapItem = getLatestVersionedItem(roadmaps);
    setLatestRoadmap(latestRoadmapItem || null);
    setSelectedRoadmapId(latestRoadmapItem?.id || null);

    const latestGoalItem = getLatestVersionedItem(goals);
    setLatestReleaseGoal(latestGoalItem || null);
    setSelectedGoalId(latestGoalItem?.id || null);

    const latestPlanItem = getLatestVersionedItem(plans);
    setLatestReleasePlan(latestPlanItem || null);
    setSelectedPlanId(latestPlanItem?.id || null);

    // Update release notes link
    const matchingReleaseNotes = product.releaseNotes.find(note => note.month === selectedMonth && note.year === selectedYear);
    if (matchingReleaseNotes && matchingReleaseNotes.link) {
      setReleaseNotesLink(matchingReleaseNotes.link);
    } else {
      setReleaseNotesLink(null);
    }
  };
  const handleRoadmapVersionSelect = (id: string) => {
    const selected = roadmapVersions.find(r => r.id === id);
    if (selected) {
      setSelectedRoadmapId(id);
    }
  };
  const handleGoalVersionSelect = (id: string) => {
    const selected = releaseGoalVersions.find(g => g.id === id);
    if (selected) {
      setSelectedGoalId(id);
    }
  };
  const handlePlanVersionSelect = (id: string) => {
    const selected = releasePlanVersions.find(p => p.id === id);
    if (selected) {
      setSelectedPlanId(id);
    }
  };
  const handleMonthYearChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };
  const handleRoadmapYearChange = (_month: number, year: number) => {
    setSelectedYear(year);
  };
  const handleDownloadProductXML = () => {
    if (productId) {
      exportProductXML(productId);
    }
  };
  const handleDownloadReleaseNotes = () => {
    if (releaseNotesLink) {
      window.open(releaseNotesLink, "_blank");
    } else {
      console.log("No release notes available to download");
    }
  };

  // Helper function to convert versions to the format expected by VersionHistory
  const convertVersionsForHistory = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      version: typeof item.version === 'string' ? parseFloat(item.version) : item.version,
      createdAt: item.createdAt
    }));
  };

  // Get the selected goal object from the ID
  const getSelectedGoal = () => {
    return releaseGoalVersions.find(goal => goal.id === selectedGoalId) || null;
  };

  // Get the selected plan object from the ID
  const getSelectedPlan = () => {
    return releasePlanVersions.find(plan => plan.id === selectedPlanId) || null;
  };
  
  // Extract goal items from the selected goal
  const getGoalItems = (): GoalItem[] => {
    const selectedGoal = getSelectedGoal();
    if (!selectedGoal) return [];
    
    // If the goal has nested goals, return those
    if (selectedGoal.goals && selectedGoal.goals.length > 0) {
      return selectedGoal.goals;
    }
    
    // Otherwise, create a goal item from the goal itself
    return [{
      id: selectedGoal.id,
      description: selectedGoal.description,
      currentState: selectedGoal.currentState,
      targetState: selectedGoal.targetState,
      status: selectedGoal.status,
      owner: selectedGoal.owner,
      priority: selectedGoal.priority,
      category: selectedGoal.category
    }];
  };

  return (
    <div className="min-h-screen bg-tnq-lightgray">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {productLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-tnq-blue border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : product ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="flex items-center space-x-1">
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </Button>
                <h1 className="text-2xl font-semibold text-tnq-navy">{product.name}</h1>
                {portfolio && (
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {portfolio.name}
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <Button variant="outline" size="icon" onClick={handleDownloadProductXML} title="Export Product XML">
                  <Download size={16} />
                </Button>
              </div>
            </div>
            
            <ProductDetailHeader 
              productName={product.name} 
              productId={productId || ''} 
              portfolioName={portfolio?.name} 
              selectedMonth={selectedMonth} 
              selectedYear={selectedYear} 
              onMonthYearChange={handleMonthYearChange} 
              showEditButton={true} 
              roadmapLink={latestRoadmap?.link} 
              roadmapVersion={latestRoadmap?.version} 
              releaseNotesLink={releaseNotesLink} 
              releaseNotesVersion="1.0" 
            />
            
            <Tabs value={activeTab} className="w-full" onValueChange={setActiveTab}>
              <TabsList className="bg-white mb-4 border-b border-gray-200 w-full flex">
                <TabsTrigger 
                  value="roadmap" 
                  className="data-[state=active]:bg-tnq-blue data-[state=active]:text-white text-gray-700"
                >
                  Roadmap
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="data-[state=active]:bg-tnq-blue data-[state=active]:text-white text-gray-700"
                >
                  Release Goals
                </TabsTrigger>
                <TabsTrigger 
                  value="plan" 
                  className="data-[state=active]:bg-tnq-blue data-[state=active]:text-white text-gray-700"
                >
                  Release Plan
                </TabsTrigger>
                <TabsTrigger 
                  value="product-metrics" 
                  className="data-[state=active]:bg-tnq-blue data-[state=active]:text-white text-gray-700"
                >
                  Product Metrics
                </TabsTrigger>
              </TabsList>
              
              {/* Roadmap Tab */}
              <TabsContent value="roadmap" className="tab-content">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-tnq-navy">Roadmap</h2>
                  
                  <div className="flex items-center gap-4">
                    <MonthYearSelector 
                      selectedMonth={1} 
                      selectedYear={selectedYear} 
                      onChange={handleRoadmapYearChange} 
                      className="compact" 
                      yearOnly={true} 
                    />
                    <VersionHistory 
                      items={convertVersionsForHistory(roadmapVersions)} 
                      onSelect={handleRoadmapVersionSelect} 
                      currentId={selectedRoadmapId || ""} 
                      hideNewVersion={true}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-tnq-blue">
                        <TableHead className="text-white">Version</TableHead>
                        <TableHead className="text-white">Date</TableHead>
                        <TableHead className="text-white">Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {latestRoadmap ? (
                        <TableRow key={latestRoadmap.id}>
                          <TableCell className="font-medium text-gray-900">{latestRoadmap.version}</TableCell>
                          <TableCell className="text-gray-900">{formatDate(latestRoadmap.createdAt)}</TableCell>
                          <TableCell>
                            <a href={latestRoadmap.link || "#"} target="_blank" rel="noopener noreferrer" className="text-tnq-blue hover:underline flex items-center">
                              View Roadmap <span className="ml-1">↗</span>
                            </a>
                          </TableCell>
                        </TableRow>
                      ) : (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                            No roadmaps available for {selectedYear}.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
              
              {/* Release Goals Tab */}
              <TabsContent value="goals" className="tab-content">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-tnq-navy">Release Goals</h2>
                  
                  <div className="flex items-center gap-4">
                    <MonthYearSelector 
                      selectedMonth={selectedMonth} 
                      selectedYear={selectedYear} 
                      onChange={handleMonthYearChange} 
                      className="compact" 
                    />
                    <VersionHistory 
                      items={convertVersionsForHistory(releaseGoalVersions)} 
                      onSelect={handleGoalVersionSelect} 
                      currentId={selectedGoalId || ""} 
                      hideNewVersion={true}
                    />
                  </div>
                </div>
                
                {getGoalItems().length > 0 ? (
                  <GoalsTable goals={getGoalItems()} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No release goals available for this period</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Release Plan Tab */}
              <TabsContent value="plan" className="tab-content">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-tnq-navy">Release Plan</h2>
                  
                  <div className="flex items-center space-x-4">
                    <MonthYearSelector 
                      selectedMonth={selectedMonth} 
                      selectedYear={selectedYear} 
                      onChange={handleMonthYearChange} 
                      className="compact" 
                    />
                    <VersionHistory 
                      items={convertVersionsForHistory(releasePlanVersions)} 
                      onSelect={handlePlanVersionSelect} 
                      currentId={selectedPlanId || ""} 
                      hideNewVersion={true}
                    />
                  </div>
                </div>
                
                {getSelectedPlan() ? (
                  <ReleasePlanTable plans={[getSelectedPlan()!]} />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500 mb-4">No release plan available for this period</p>
                  </div>
                )}
              </TabsContent>
              
              {/* Metrics Tab */}
              <TabsContent value="product-metrics" className="tab-content">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-tnq-navy">Product Metrics</h2>
                  
                  <div className="flex items-center">
                    <MonthYearSelector 
                      selectedMonth={selectedMonth} 
                      selectedYear={selectedYear} 
                      onChange={handleMonthYearChange} 
                      className="compact" 
                    />
                  </div>
                </div>
                
                <MetricsDisplay 
                  metrics={product.metrics.filter(m => m.month === selectedMonth && m.year === selectedYear)} 
                  detailed={true} 
                />
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-600">Product not found</div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProductDetail;
