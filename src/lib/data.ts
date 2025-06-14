// src/lib/data.ts
import { adminLogger } from "./adminLogger";
import { Product, Portfolio, Metric, Roadmap, ReleaseGoal, ReleasePlan, ReleaseNote, MetricItem } from './types'; // Import MetricItem
import { storageService } from '../services/storageService'; // Import storageService
import { getLatestVersionedItem } from './utils';
import { format } from 'date-fns';

const PORTFOLIO_CONFIG_FILE = 'public/data/PortfolioProduct.xml'; // Updated path for storageService

// Cache for portfolio data
let portfolioCache: Portfolio[] | null = null;

// Parse XML string to get portfolio structure and product file paths
async function parsePortfolioStructure(): Promise<{portfolios: Array<{id: string, name: string, products: Array<{id: string, name: string, description: string, filepath: string}>}>}> {
  try {
    const xmlText = await storageService.load(PORTFOLIO_CONFIG_FILE); // Use storageService.load
    if (!xmlText) {
      throw new Error(`Failed to load portfolio config from ${PORTFOLIO_CONFIG_FILE}`);
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
    
    const portfolios: Array<{id: string, name: string, products: Array<{id: string, name: string, description: string, filepath: string}>}> = [];
    
    const portfolioElements = xmlDoc.querySelectorAll('Portfolio');
    portfolioElements.forEach(portfolioEl => {
      const portfolio = {
        id: portfolioEl.getAttribute('id') || '',
        name: portfolioEl.getAttribute('name') || '',
        products: [] as Array<{id: string, name: string, description: string, filepath: string}>
      };
      
      const productElements = portfolioEl.querySelectorAll('Product');
      productElements.forEach(productEl => {
        portfolio.products.push({
          id: productEl.getAttribute('id') || '',
          name: productEl.getAttribute('name') || '',
          description: productEl.getAttribute('description') || '',
          filepath: productEl.getAttribute('filepath') || ''
        });
      });
      
      portfolios.push(portfolio);
    });
    
    return { portfolios };
  } catch (error) {
    console.error('Error parsing portfolio structure:', error);
    return { portfolios: [] };
  }
}

// Parse individual product XML file
async function parseProductXML(filepath: string): Promise<Product | null> {
  try {
    // Convert backslashes to forward slashes and ensure proper path
    const cleanPath = filepath.replace(/\\/g, '/');
    
    console.log(`Loading product XML from: ${cleanPath}`);
    
    const xmlText = await storageService.load(cleanPath); // Use storageService.load
    if (!xmlText) {
      console.error(`Failed to load product XML from ${cleanPath}`);
      return null;
    }
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Check for XML parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      console.error('XML parsing error:', parseError.textContent);
      return null;
    }

    // Find the Product element using a more robust selector that handles different XML structures
    const productEl = xmlDoc.querySelector('Product, Products > Product');
                   
    if (!productEl) {
      console.error('No Product element found in XML structure. XML content:', xmlText.substring(0, 200) + '...');
      return null;
    }
    
    const product: Product = {
      id: productEl.getAttribute('id') || '',
      name: productEl.getAttribute('name') || '',
      description: productEl.getAttribute('description') || '',
      metrics: [],
      roadmap: [],
      releaseGoals: [],
      releasePlans: [],
      releaseNotes: []
    };
    
    // Parse metrics
    const metricElements = productEl.querySelectorAll('Metrics > Metric'); // Select parent Metric elements
    metricElements.forEach(metricEl => {
      const metric: Metric = {
        id: metricEl.getAttribute('id') || '',
        month: parseInt(metricEl.getAttribute('month') || '0'),
        year: parseInt(metricEl.getAttribute('year') || '0'),
        createdAt: metricEl.getAttribute('createdAt') || '',
        version: parseFloat(metricEl.getAttribute('version') || '1.0'),
        metricItems: [] // Initialize metricItems array
      };

      // Parse MetricItem children
      const metricItemElements = metricEl.querySelectorAll('MetricItem');
      metricItemElements.forEach(itemEl => {
        const metricItem: MetricItem = {
          id: itemEl.getAttribute('id') || '',
          name: itemEl.getAttribute('name') || '',
          value: parseFloat(itemEl.getAttribute('value') || '0'),
          previousValue: parseFloat(itemEl.getAttribute('previousValue') || '0'),
          unit: itemEl.getAttribute('unit') || '',
          timestamp: itemEl.getAttribute('timestamp') || '',
          description: itemEl.getAttribute('description') || '',
          monthlyTarget: itemEl.getAttribute('monthlyTarget') ? parseFloat(itemEl.getAttribute('monthlyTarget') || '0') : undefined,
          annualTarget: itemEl.getAttribute('annualTarget') ? parseFloat(itemEl.getAttribute('annualTarget') || '0') : undefined,
          status: (itemEl.getAttribute('status') || 'on-track') as 'on-track' | 'at-risk' | 'off-track',
          notes: itemEl.getAttribute('notes') || '',
          source: itemEl.getAttribute('source') || '',
          category: itemEl.getAttribute('category') || '',
          owner: itemEl.getAttribute('owner') || ''
        };
        metric.metricItems.push(metricItem);
      });
      product.metrics.push(metric);
    });
    
    // Parse roadmaps
    const roadmapElements = productEl.querySelectorAll('Roadmap, Roadmaps > Roadmap');
    roadmapElements.forEach(roadmapEl => {
      const quarter = parseInt(roadmapEl.getAttribute('quarter') || '1') as 1 | 2 | 3 | 4;
      const status = (roadmapEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed';
      
      const roadmap: Roadmap = {
        id: roadmapEl.getAttribute('id') || '',
        year: parseInt(roadmapEl.getAttribute('year') || '0'),
        quarter: quarter,
        title: roadmapEl.getAttribute('title') || '',
        description: roadmapEl.getAttribute('description') || '',
        status: status,
        createdAt: roadmapEl.getAttribute('createdAt') || '',
        version: roadmapEl.getAttribute('version') || '',
        link: roadmapEl.getAttribute('link') || ''
      };
      
      product.roadmap.push(roadmap);
    });
    
    // Parse release goals
    const goalElements = productEl.querySelectorAll('ReleaseGoal, ReleaseGoals > ReleaseGoal');
    goalElements.forEach(goalEl => {
      const status = (goalEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed';
      
      const releaseGoal: ReleaseGoal = {
        id: goalEl.getAttribute('id') || '',
        month: parseInt(goalEl.getAttribute('month') || '0'),
        year: parseInt(goalEl.getAttribute('year') || '0'),
        description: goalEl.getAttribute('description') || '',
        currentState: goalEl.getAttribute('currentState') || '',
        targetState: goalEl.getAttribute('targetState') || '',
        owner: goalEl.getAttribute('owner') || '',
        priority: goalEl.getAttribute('priority') || '',
        status: status,
        category: goalEl.getAttribute('category') || '',
        createdAt: goalEl.getAttribute('createdAt') || '',
        version: parseInt(goalEl.getAttribute('version') || '1'),
        goals: [] // Initialize empty goals array
      };
      
      // Check for nested GoalItem elements
      const goalItemElements = goalEl.querySelectorAll('Goals > GoalItem');
      if (goalItemElements.length > 0) {
        goalItemElements.forEach(itemEl => {
          releaseGoal.goals.push({
            id: itemEl.getAttribute('id') || '',
            description: itemEl.getAttribute('description') || '',
            currentState: itemEl.getAttribute('currentState') || '',
            targetState: itemEl.getAttribute('targetState') || '',
            status: (itemEl.getAttribute('status') || status) as 'planned' | 'in-progress' | 'completed' | 'delayed',
            owner: itemEl.getAttribute('owner') || releaseGoal.owner,
            priority: itemEl.getAttribute('priority') || releaseGoal.priority,
            category: itemEl.getAttribute('category') || releaseGoal.category
          });
        });
      } else {
        // If no nested goals, create one from the parent attributes
        releaseGoal.goals.push({
          id: `${releaseGoal.id}-item-1`,
          description: releaseGoal.description,
          currentState: releaseGoal.currentState,
          targetState: releaseGoal.targetState,
          status: releaseGoal.status,
          owner: releaseGoal.owner,
          priority: releaseGoal.priority,
          category: releaseGoal.category
        });
      }
      
      product.releaseGoals.push(releaseGoal);
    });
    
    // Parse release plans
    const planElements = productEl.querySelectorAll('ReleasePlan, ReleasePlans > ReleasePlan');
    planElements.forEach(planEl => {
      const status = (planEl.getAttribute('status') || 'planned') as 'planned' | 'in-progress' | 'completed' | 'delayed';
      const priority = (planEl.getAttribute('priority') || 'Medium') as 'High' | 'Medium' | 'Low';
      const category = (planEl.getAttribute('category') || 'Enhancement') as 'Enhancement' | 'Bug' | 'Improvement' | 'Clarification' | 'Training';
      const source = (planEl.getAttribute('source') || 'Internal') as 'Internal' | 'Customer' | 'Market' | 'Regulatory' | 'Other';
      
      const releasePlan: ReleasePlan = {
        id: planEl.getAttribute('id') || '',
        month: parseInt(planEl.getAttribute('month') || '0'),
        year: parseInt(planEl.getAttribute('year') || '0'),
        title: planEl.getAttribute('title') || '',
        description: planEl.getAttribute('description') || '',
        category: category,
        priority: priority,
        source: source,
        targetDate: planEl.getAttribute('targetDate') || '',
        owner: planEl.getAttribute('owner') || '',
        status: status,
        createdAt: planEl.getAttribute('createdAt') || '',
        version: parseInt(planEl.getAttribute('version') || '1'),
        items: [] // Initialize empty items array
      };
      
      // Check for nested ReleasePlanItem elements
      const planItemElements = planEl.querySelectorAll('ReleasePlanItems > ReleasePlanItem, ReleasePlanItem');
      if (planItemElements.length > 0) {
        planItemElements.forEach(itemEl => {
          const itemStatus = (itemEl.getAttribute('status') || status) as 'planned' | 'in-progress' | 'completed' | 'delayed';
          const itemPriority = (itemEl.getAttribute('priority') || priority) as 'High' | 'Medium' | 'Low';
          const itemCategory = (itemEl.getAttribute('category') || category) as 'Enhancement' | 'Bug' | 'Improvement' | 'Clarification' | 'Training';
          const itemSource = (itemEl.getAttribute('source') || source) as 'Internal' | 'Customer' | 'Market' | 'Regulatory' | 'Other';
          
          releasePlan.items.push({
            id: itemEl.getAttribute('id') || '',
            title: itemEl.getAttribute('title') || itemEl.getAttribute('featurename') || '',
            description: itemEl.getAttribute('description') || '',
            category: itemCategory,
            priority: itemPriority,
            source: itemSource,
            targetDate: itemEl.getAttribute('targetDate') || releasePlan.targetDate,
            owner: itemEl.getAttribute('owner') || releasePlan.owner,
            status: itemStatus
          });
        });
      } else {
        // If no nested items, create one from the parent attributes
        releasePlan.items.push({
          id: `${releasePlan.id}-item-1`,
          title: releasePlan.title,
          description: releasePlan.description,
          category: releasePlan.category,
          priority: releasePlan.priority,
          source: releasePlan.source,
          targetDate: releasePlan.targetDate,
          owner: releasePlan.owner,
          status: releasePlan.status
        });
      }
      
      product.releasePlans.push(releasePlan);
    });
    
    // Parse release notes
    const noteElements = productEl.querySelectorAll('ReleaseNote, ReleaseNotes > ReleaseNote');
    noteElements.forEach(noteEl => {
      const type = (noteEl.getAttribute('type') || 'feature') as 'feature' | 'enhancement' | 'fix' | 'other';
      
      const releaseNote: ReleaseNote = {
        id: noteEl.getAttribute('id') || '',
        month: parseInt(noteEl.getAttribute('month') || '0'),
        year: parseInt(noteEl.getAttribute('year') || '0'),
        title: noteEl.getAttribute('title') || '',
        description: noteEl.getAttribute('description') || '',
        type: type,
        highlights: noteEl.getAttribute('highlights') || '',
        createdAt: noteEl.getAttribute('createdAt') || '',
        version: parseInt(noteEl.getAttribute('version') || '1'),
        link: noteEl.getAttribute('link') || ''
      };
      product.releaseNotes.push(releaseNote);
    });
    
    console.log(`Loaded product: ${product.name} with ${product.metrics.length} metrics, ${product.roadmap.length} roadmaps, ${product.releaseGoals.length} goals, ${product.releasePlans.length} plans, ${product.releaseNotes.length} notes`);
    
    return product;
  } catch (error) {
    console.error(`Error parsing product XML from ${filepath}:`, error);
    return null;
  }
}

// Get all portfolios with products loaded from individual XML files
export async function getPortfolios(): Promise<Portfolio[]> {
  // Check cache first
  if (portfolioCache) {
    console.log('Returning cached portfolios');
    return portfolioCache;
  }

  try {
    console.log('Loading portfolios from XML files...');
    const structure = await parsePortfolioStructure();
    const portfolios: Portfolio[] = [];
    
    for (const portfolioData of structure.portfolios) {
      console.log(`Loading portfolio: ${portfolioData.name}`);
      const portfolio: Portfolio = {
        id: portfolioData.id,
        name: portfolioData.name,
        products: []
      };
      
      // Load each product from its individual XML file
      for (const productData of portfolioData.products) {
        if (productData.filepath) {
          console.log(`Loading product: ${productData.name} from ${productData.filepath}`);
          const product = await parseProductXML(productData.filepath);
          if (product) {
            portfolio.products.push(product);
          } else {
            // Create a basic product if XML parsing fails
            console.log(`Creating empty product: ${productData.name}`);
            portfolio.products.push({
              id: productData.id,
              name: productData.name,
              description: productData.description,
              metrics: [],
              roadmap: [],
              releaseGoals: [],
              releasePlans: [],
              releaseNotes: []
            });
          }
        }
      }
      
      portfolios.push(portfolio);
    }
    
    // Cache the result
    portfolioCache = portfolios;
    
    // Store in localStorage in the correct format for compatibility with edit functions
    const allProducts = portfolios.flatMap(p => p.products);
    console.log('Storing data in localStorage with productPortalConfig format');
    
    const productPortalConfig = {
      portfolios: portfolios,
      products: allProducts
    };
    
    localStorage.setItem('productPortalConfig', JSON.stringify(productPortalConfig));
    
    // Also store portfolios separately for backward compatibility
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    
    // Store last cache update timestamp
    localStorage.setItem('lastCacheUpdate', new Date().toISOString());
    
    console.log(`Loaded ${portfolios.length} portfolios with ${allProducts.length} total products`);
    console.log('Sample data check:', {
      firstProduct: allProducts[0]?.name,
      firstProductMetrics: allProducts[0]?.metrics?.length || 0,
      firstProductGoals: allProducts[0]?.releaseGoals?.length || 0,
      firstProductPlans: allProducts[0]?.releasePlans?.length || 0,
      firstProductNotes: allProducts[0]?.releaseNotes?.length || 0
    });
    
    return portfolios;
  } catch (error) {
    console.error('Error loading portfolios:', error);
    return [];
  }
}

// Clear portfolio cache
export function clearPortfolioCache(): void {
  portfolioCache = null;
  localStorage.removeItem('lastCacheUpdate');
  console.log('Portfolio cache cleared');
}

// Get all products across portfolios
export async function getAllProducts(): Promise<Product[]> {
  const portfolios = await getPortfolios();
  return portfolios.flatMap(p => p.products);
}

// Get current month data for a product
export function getCurrentMonthData(product: Product) {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Filter roadmaps for current year and get the latest version
  const roadmaps = product.roadmap?.filter(r => r.year === currentYear) || [];
  const latestRoadmap = getLatestVersionedItem(roadmaps);

  // Filter goals for current month/year and get the latest version
  const goals = product.releaseGoals?.filter(g => g.month === currentMonth && g.year === currentYear) || [];
  const latestReleaseGoal = getLatestVersionedItem(goals);

  // Filter plans for current month/year and get the latest version
  const plans = product.releasePlans?.filter(p => p.month === currentMonth && p.year === currentYear) || [];
  const latestReleasePlan = getLatestVersionedItem(plans);

  // Filter notes for current month/year and get the latest version
  const notes = product.releaseNotes?.filter(n => n.month === currentMonth && n.year === currentYear) || [];
  const latestReleaseNote = getLatestVersionedItem(notes);

  return {
    latestRoadmap,
    latestReleaseGoal,
    latestReleasePlan,
    latestReleaseNote
  };
}

// Find a product by ID across all portfolios
export async function findProductById(productId: string): Promise<{ product: Product | null; portfolio: Portfolio | null }> {
  // First try to get data from localStorage if available
  try {
    const storedConfig = localStorage.getItem('productPortalConfig');
    if (storedConfig) {
      const allData = JSON.parse(storedConfig);
      const foundProduct = allData.products?.find((p: Product) => p.id === productId);
      
      if (foundProduct) {
        const foundPortfolio = allData.portfolios?.find((portfolio: Portfolio) => 
          portfolio.products?.some((p: any) => p.id === productId)
        );
        
        console.log(`Found product ${foundProduct.name} in localStorage with:`, {
          metrics: foundProduct.metrics?.length || 0,
          goals: foundProduct.releaseGoals?.length || 0,
          plans: foundProduct.releasePlans?.length || 0,
          notes: foundProduct.releaseNotes?.length || 0
        });
        
        return { product: foundProduct, portfolio: foundPortfolio || null };
      }
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Fallback to loading from XML files
  const portfolios = await getPortfolios();
  
  for (const portfolio of portfolios) {
    const product = portfolio.products.find(p => p.id === productId);
    if (product) {
      return { product, portfolio };
    }
  }
  
  return { product: null, portfolio: null };
}

// Update portfolios (this would need to save back to individual XML files in a real implementation)
export function updatePortfolios(portfolios: Portfolio[]): void {
  console.log('updatePortfolios: Saving to localStorage and updating cache');
  
  // Store in localStorage for the current session
  localStorage.setItem('portfolios', JSON.stringify(portfolios));
  
  // Also update productPortalConfig format
  const allProducts = portfolios.flatMap(p => p.products);
  const productPortalConfig = {
    portfolios: portfolios,
    products: allProducts
  };
  
  localStorage.setItem('productPortalConfig', JSON.stringify(productPortalConfig));
  
  // Update cache
  portfolioCache = portfolios;
  
  // Update last cache update timestamp
  localStorage.setItem('lastCacheUpdate', new Date().toISOString());
  
  // Dispatch a custom event to notify other components of the update
  const updateEvent = new CustomEvent('productDataUpdated');
  window.dispatchEvent(updateEvent);
}

// Convert portfolios to XML format
export function portfoliosToXML(portfolios: Portfolio[]): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ProductPortal>\n  <Portfolios>\n';
  
  portfolios.forEach(portfolio => {
    xml += `    <Portfolio id="${escapeXml(portfolio.id)}" name="${escapeXml(portfolio.name)}">\n`;
    xml += '      <Products>\n';
    
    portfolio.products.forEach(product => {
      xml += `        <Product id="${escapeXml(product.id)}" name="${escapeXml(product.name)}" description="${escapeXml(product.description || '')}" filepath="public/data/product/${product.name.replace(/\s+/g, '-')}-${product.id}.xml" />\n`;
    });
    
    xml += '      </Products>\n';
    xml += '    </Portfolio>\n';
  });
  
  xml += '  </Portfolios>\n</ProductPortal>';
  return xml;
}

// Parse XML configuration
export async function parseXMLConfig(xmlContent: string): Promise<Portfolio[]> {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
    
    const portfolios: Portfolio[] = [];
    const portfolioElements = xmlDoc.querySelectorAll('Portfolio');
    
    portfolioElements.forEach(portfolioEl => {
      const portfolio: Portfolio = {
        id: portfolioEl.getAttribute('id') || '',
        name: portfolioEl.getAttribute('name') || '',
        products: []
      };
      
      const productElements = portfolioEl.querySelectorAll('Product');
      productElements.forEach(productEl => {
        const product: Product = {
          id: productEl.getAttribute('id') || '',
          name: productEl.getAttribute('name') || '',
          description: productEl.getAttribute('description') || '',
          metrics: [],
          roadmap: [],
          releaseGoals: [],
          releasePlans: [],
          releaseNotes: []
        };
        
        portfolio.products.push(product);
      });
      
      portfolios.push(portfolio);
    });
    
    return portfolios;
  } catch (error) {
    console.error('Error parsing XML config:', error);
    return [];
  }
}

// Get previous month data for a product
export function getPreviousMonthData(product: Product): { latestReleaseNote?: ReleaseNote } {
  const currentDate = new Date();
  const previousMonth = currentDate.getMonth();
  const previousYear = previousMonth === 0 ? currentDate.getFullYear() - 1 : currentDate.getFullYear();
  const actualPreviousMonth = previousMonth === 0 ? 12 : previousMonth;

  // Filter notes for previous month/year and get the latest version
  const notes = product.releaseNotes?.filter(n => 
    n.month === actualPreviousMonth && n.year === previousYear
  ) || [];
  
  const latestReleaseNote = getLatestVersionedItem(notes);

  return { latestReleaseNote };
}

// Generate sample data for testing
export function generateSampleData(productId: string) {
  const now = new Date().toISOString();
  return {
    metrics: [
      {
        id: `metric-${productId}-sample`,
        name: "Sample Metric",
        value: 85,
        previousValue: 80,
        unit: "%",
        timestamp: now,
        description: "Sample metric description",
        month: 5,
        year: 2025,
        source: "Internal",
        category: "Performance",
        owner: "Product Team",
        version: 1
      }
    ],
    roadmap: {
      id: `roadmap-${productId}-sample`,
      year: 2025,
      quarter: 2 as 1 | 2 | 3 | 4,
      title: "Sample Roadmap Item",
      description: "Sample roadmap description",
      status: "completed" as const,
      createdAt: now,
      version: "1.0"
    },
    releaseGoal: {
      id: `goal-${productId}-sample`,
      month: 5,
      year: 2025,
      description: "Sample release goal",
      currentState: "Current state",
      targetState: "Target state",
      owner: "Product Manager",
      priority: "High",
      status: "planned" as const,
      category: "Feature",
      createdAt: now,
      version: 1,
      goals: [
        {
          id: `goal-item-${productId}-sample`,
          description: "Sample release goal",
          currentState: "Current state",
          targetState: "Target state",
          status: "planned" as const,
          owner: "Product Manager",
          priority: "High",
          category: "Feature"
        }
      ]
    },
    releasePlan: {
      id: `plan-${productId}-sample`,
      month: 5,
      year: 2025,
      title: "Sample Plan Item",
      description: "Sample plan description",
      category: "Enhancement" as const,
      priority: "Medium" as const,
      source: "Internal" as const,
      targetDate: now,
      owner: "Development Team",
      status: "planned" as const,
      createdAt: now,
      version: 1,
      items: [
        {
          id: `plan-item-${productId}-sample`,
          title: "Sample Plan Item",
          description: "Sample plan description",
          category: "Enhancement" as const,
          priority: "Medium" as const,
          source: "Internal" as const,
          targetDate: now,
          owner: "Development Team",
          status: "planned" as const
        }
      ]
    },
    releaseNote: {
      id: `note-${productId}-sample`,
      month: 5,
      year: 2025,
      title: "Sample Release Note",
      description: "Sample release note description",
      type: "feature" as const,
      highlights: "Sample release highlights",
      createdAt: now,
      version: 1,
      link: ""
    }
  };
}

// Helper function to escape XML special characters
export function escapeXml(value: any): string {
  if (value === undefined || value === null) return '';
  
  // Convert to string if it's not already
  const str = String(value);
  
  // Properly escape XML special characters in the correct order
  // CRITICAL: & must be escaped first to avoid double-escaping
  const escaped = str
    .replace(/&/g, '&')   // Must be first to avoid double-escaping
    .replace(/</g, '<')    // Less than
    .replace(/>/g, '>')    // Greater than
    .replace(/"/g, '"')  // Double quote
    .replace(/'/g, '&apos;'); // Single quote/apostrophe
  
  return escaped;
}

