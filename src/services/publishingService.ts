import { xmlApiService, XMLOperationResult } from './xmlApiService';
import { getPortfolios } from '../lib/data';
import { Portfolio, Product } from '../lib/types';

export interface PublishStatus {
  id: string;
  status: 'idle' | 'publishing' | 'success' | 'error';
  startTime?: Date;
  endTime?: Date;
  error?: string;
  publishedFiles?: string[];
  totalFiles?: number;
}

export interface PublishOptions {
  includeIndividualProducts: boolean;
  includeCombinedXML: boolean;
  productIds?: string[];
  portfolioIds?: string[];
}

class PublishingService {
  private static instance: PublishingService;
  private publishStatus: PublishStatus = { id: '', status: 'idle' };
  private publishHistory: PublishStatus[] = [];

  public static getInstance(): PublishingService {
    if (!PublishingService.instance) {
      PublishingService.instance = new PublishingService();
    }
    return PublishingService.instance;
  }

  // Get current publish status
  getPublishStatus(): PublishStatus {
    return { ...this.publishStatus };
  }

  // Get publish history
  getPublishHistory(): PublishStatus[] {
    return [...this.publishHistory];
  }

  // Publish all products and portfolios
  async publishAll(options: PublishOptions = {
    includeIndividualProducts: true,
    includeCombinedXML: true
  }): Promise<XMLOperationResult> {
    const publishId = `publish-${Date.now()}`;
    
    this.publishStatus = {
      id: publishId,
      status: 'publishing',
      startTime: new Date(),
      publishedFiles: [],
      totalFiles: 0
    };

    try {
      console.log('PublishingService: Starting publish all operation');
      
      // Get all portfolios
      const portfolios = await getPortfolios();
      
      if (!portfolios || portfolios.length === 0) {
        throw new Error('No portfolios found to publish');
      }

      // Filter portfolios if specified
      const targetPortfolios = options.portfolioIds 
        ? portfolios.filter(p => options.portfolioIds!.includes(p.id))
        : portfolios;

      // Filter products if specified
      const targetProducts: Product[] = [];
      for (const portfolio of targetPortfolios) {
        const portfolioProducts = options.productIds
          ? portfolio.products.filter(p => options.productIds!.includes(p.id))
          : portfolio.products;
        targetProducts.push(...portfolioProducts);
      }

      this.publishStatus.totalFiles = targetProducts.length + (options.includeCombinedXML ? 1 : 0);
      console.log(`PublishingService: Publishing ${this.publishStatus.totalFiles} files`);

      const publishedFiles: string[] = [];

      // Publish individual products if requested
      if (options.includeIndividualProducts) {
        for (const product of targetProducts) {
          const result = await xmlApiService.publishProductXML(product.id, product);
          if (result.success && result.data?.path) {
            publishedFiles.push(result.data.path);
            console.log(`PublishingService: Published ${product.name}`);
          } else {
            console.error(`PublishingService: Failed to publish ${product.name}:`, result.error);
          }
        }
      }

      // Publish combined XML if requested
      if (options.includeCombinedXML) {
        const result = await xmlApiService.publishPortfolioXMLs(targetPortfolios);
        if (result.success && result.data?.paths) {
          publishedFiles.push(...result.data.paths);
          console.log('PublishingService: Published combined portfolio XML');
        } else {
          console.error('PublishingService: Failed to publish combined XML:', result.error);
        }
      }

      // Update status
      this.publishStatus = {
        ...this.publishStatus,
        status: 'success',
        endTime: new Date(),
        publishedFiles
      };

      // Add to history
      this.publishHistory.unshift({ ...this.publishStatus });
      
      // Keep only last 10 publish operations in history
      if (this.publishHistory.length > 10) {
        this.publishHistory = this.publishHistory.slice(0, 10);
      }

      console.log(`PublishingService: Successfully published ${publishedFiles.length} files`);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('publishCompleted', {
        detail: { status: this.publishStatus }
      }));

      return {
        success: true,
        data: {
          publishedFiles,
          totalFiles: this.publishStatus.totalFiles,
          publishId
        }
      };

    } catch (error) {
      console.error('PublishingService: Error during publish operation:', error);
      
      this.publishStatus = {
        ...this.publishStatus,
        status: 'error',
        endTime: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      // Add to history
      this.publishHistory.unshift({ ...this.publishStatus });

      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('publishFailed', {
        detail: { status: this.publishStatus }
      }));

      return {
        success: false,
        error: this.publishStatus.error
      };
    }
  }

  // Publish specific products
  async publishProducts(productIds: string[]): Promise<XMLOperationResult> {
    return this.publishAll({
      includeIndividualProducts: true,
      includeCombinedXML: false,
      productIds
    });
  }

  // Publish specific portfolios
  async publishPortfolios(portfolioIds: string[]): Promise<XMLOperationResult> {
    return this.publishAll({
      includeIndividualProducts: true,
      includeCombinedXML: true,
      portfolioIds
    });
  }

  // Get list of published files
  async getPublishedFiles(): Promise<XMLOperationResult> {
    return xmlApiService.getPublishedXMLs();
  }

  // Download published XML
  async downloadPublishedXML(filename: string): Promise<XMLOperationResult> {
    const result = await xmlApiService.getPublishedXML(filename);
    
    if (result.success && result.data) {
      // Create blob and trigger download
      const blob = new Blob([result.data], { type: 'text/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);

      return { success: true };
    }

    return result;
  }

  // Clear publish history
  clearHistory(): void {
    this.publishHistory = [];
  }

  // Reset publish status
  resetStatus(): void {
    this.publishStatus = { id: '', status: 'idle' };
  }
}

// Export singleton instance
export const publishingService = PublishingService.getInstance();
