
import { Portfolio, Product, Metric, Roadmap, RoadmapItem, ReleaseGoal, ReleasePlan, ReleaseNote } from '../lib/types';

export class FileDataService {
  private STORAGE_KEY = 'productPortalConfig';
  private portfolios: Portfolio[] = [];
  private lastLoaded: Date | null = null;

  constructor() {
    // Don't auto-load on construction to avoid blocking
  }

  async savePortfolios(portfolios: Portfolio[]): Promise<boolean> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(portfolios));
      this.portfolios = portfolios;
      this.lastLoaded = new Date();
      console.log('FileDataService: Portfolios saved to localStorage');
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('productDataUpdated'));
      return true;
    } catch (error) {
      console.error('FileDataService: Error saving portfolios to localStorage:', error);
      return false;
    }
  }

  clearCache(): void {
    this.portfolios = [];
    this.lastLoaded = null;
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('FileDataService: Cache cleared');
  }

  getDataStats() {
    return {
      portfolioCount: this.portfolios.length,
      productCount: this.portfolios.reduce((count, portfolio) => count + portfolio.products.length, 0),
      lastModified: this.lastLoaded
    };
  }

  async loadPortfolios(): Promise<Portfolio[]> {
    try {
      console.log('FileDataService: Loading portfolios from localStorage...');
      const stored = localStorage.getItem(this.STORAGE_KEY);
      
      if (!stored) {
        console.log('FileDataService: No stored data found in localStorage');
        return [];
      }

      const data = JSON.parse(stored);
      
      // Validate and transform the data to ensure type safety
      const portfolios: Portfolio[] = data.map((portfolioData: any) => ({
        id: portfolioData.id || '',
        name: portfolioData.name || '',
        description: portfolioData.description,
        products: (portfolioData.products || []).map((productData: any) => ({
          id: productData.id || '',
          name: productData.name || '',
          description: productData.description,
          metrics: (productData.metrics || []).map((metric: any) => ({
            id: metric.id || '',
            name: metric.name || '',
            value: metric.value || 0,
            previousValue: metric.previousValue,
            unit: metric.unit || '',
            timestamp: metric.timestamp || new Date().toISOString(),
            description: metric.description,
            month: metric.month || 1,
            year: metric.year || new Date().getFullYear(),
            monthlyTarget: metric.monthlyTarget,
            annualTarget: metric.annualTarget,
            status: metric.status,
            notes: metric.notes,
            version: metric.version
          })),
          roadmap: (productData.roadmap || []).map((roadmap: any) => ({
            id: roadmap.id || '',
            year: roadmap.year || new Date().getFullYear(),
            items: (roadmap.items || []).map((item: any) => ({
              id: item.id || '',
              quarter: (item.quarter || 1) as 1 | 2 | 3 | 4,
              title: item.title || '',
              description: item.description || '',
              status: item.status || 'planned'
            })),
            createdAt: roadmap.createdAt || new Date().toISOString(),
            version: roadmap.version || "1.0",
            link: roadmap.link
          })),
          releaseGoals: (productData.releaseGoals || []).map((goal: any) => ({
            id: goal.id || '',
            productId: productData.id,
            month: goal.month || 1,
            year: goal.year || new Date().getFullYear(),
            goal: goal.goal,
            currentState: goal.currentState,
            targetState: goal.targetState,
            createdAt: goal.createdAt || new Date().toISOString(),
            version: goal.version || 1,
            remarks: goal.remarks,
            themeId: goal.themeId,
            // Backward compatibility properties
            goals: goal.goals || [],
            futureState: goal.futureState || goal.targetState,
            name: goal.name
          })),
          releasePlans: (productData.releasePlans || []).map((plan: any) => ({
            id: plan.id || '',
            productId: productData.id,
            month: plan.month || 1,
            year: plan.year || new Date().getFullYear(),
            featureName: plan.featureName,
            description: plan.description,
            category: plan.category,
            priority: plan.priority,
            source: plan.source,
            sourceName: plan.sourceName,
            owner: plan.owner,
            status: plan.status || 'planned',
            createdAt: plan.createdAt || new Date().toISOString(),
            version: plan.version || 1,
            remarks: plan.remarks,
            goalId: plan.goalId,
            // Backward compatibility properties
            items: plan.items || [],
            name: plan.name
          })),
          releaseNotes: (productData.releaseNotes || []).map((note: any) => ({
            id: note.id || '',
            productId: productData.id,
            month: note.month || 1,
            year: note.year || new Date().getFullYear(),
            releaseNotesLink: note.releaseNotesLink || note.link,
            createdAt: note.createdAt || new Date().toISOString(),
            version: note.version || 1,
            // Backward compatibility properties
            link: note.link || note.releaseNotesLink,
            highlights: note.highlights || [],
            details: note.details || []
          }))
        }))
      }));

      this.portfolios = portfolios;
      this.lastLoaded = new Date();
      console.log('FileDataService: Successfully loaded', portfolios.length, 'portfolios from localStorage');
      return portfolios;
    } catch (error) {
      console.error('FileDataService: Error loading portfolios:', error);
      return [];
    }
  }
}

export const fileDataService = new FileDataService();
