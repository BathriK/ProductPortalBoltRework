// src/services/xmlApiService.ts
import { storageService } from './storageService';
import { supabase } from '@/integrations/supabase/client';
import { Product, Portfolio, Metric, MetricItem, ProductObjective } from '../lib/types'; // Import MetricItem and ProductObjective
import { escapeXml } from '../lib/data';
import { format } from 'date-fns';
import { adminLogger } from '../lib/adminLogger';

export interface XMLOperationResult {
  success: boolean;
  error?: string;
  data?: any;
}

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`XMLApiService: ${action}`, details, level);
}

export class XMLApiService {
  private static instance: XMLApiService;

  public static getInstance(): XMLApiService {
    if (!XMLApiService.instance) {
      XMLApiService.instance = new XMLApiService();
    }
    return XMLApiService.instance;
  }

  // Save product to XML storage
  async saveProductXML(productId: string, product: Product): Promise<XMLOperationResult> {
    try {
      logAdminAction('Starting to save product XML', { 
        productId, 
        productName: product.name,
        metricsCount: product.metrics?.length || 0,
        goalsCount: product.releaseGoals?.length || 0,
        plansCount: product.releasePlans?.length || 0,
        notesCount: product.releaseNotes?.length || 0,
        objectivesCount: product.objectives?.length || 0
      });
      
      const xmlContent = this.generateProductXML(product);
      
      logAdminAction('Generated XML content', { 
        productId, 
        xmlLength: xmlContent.length,
        xmlPreview: xmlContent.substring(0, 500) + (xmlContent.length > 500 ? '...' : '')
      });
      
      // Validate XML before saving
      const validationResult = this.validateXML(xmlContent);
      if (!validationResult.isValid) {
        logAdminAction('XML validation failed', { 
          productId, 
          error: validationResult.error,
          xmlContent: xmlContent
        }, 'ERROR');
        return { success: false, error: 'Invalid XML structure generated' };
      }
      
      logAdminAction('XML validation passed', { productId });
      
      // Create versioned filename with timestamp
      const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
      
      const safeName = product.name.replace(/[^\w\-]/g, '-');
      // const baseFilename = `${safeName}-${product.id}`;
      const baseFilename = `${product.id}`;

      const path = `public/data/product/${baseFilename}.xml`;
      const versionedPath = `public/data/product/versions/${baseFilename}_${timestamp}.xml`;
      
      // Save both current and versioned copies using storageService
      const success = await storageService.save(path, xmlContent);
      
      if (success) {
        // Also save versioned copy
        await storageService.save(versionedPath, xmlContent);
        logAdminAction('Successfully saved product XML', { 
          productId, 
          path, 
          versionedPath 
        });
        return { success: true, data: { path, versionedPath } };
      } else {
        logAdminAction('Failed to save XML to storage', { productId }, 'ERROR');
        return { success: false, error: 'Failed to save XML to storage' };
      }
    } catch (error) {
      logAdminAction('Error saving product XML', { productId, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Load product from XML storage
  async loadProductXML(productId: string, productName?: string): Promise<XMLOperationResult> {
    try {
      logAdminAction('Starting to load product XML', { productId, productName });
      
      // Try to find the XML file by listing available files
      const availableFiles = await storageService.list('public/data/product/');
      const targetFile = availableFiles.find(file => file.includes(`-${productId}.xml`));
      
      if (!targetFile) {
        logAdminAction('No XML file found for product', { productId }, 'WARN');
        return { success: false, error: `No XML file found for product ${productId}` };
      }

      const xmlContent = await storageService.load(targetFile);
      
      if (!xmlContent) {
        logAdminAction('Failed to load XML content', { productId, targetFile }, 'ERROR');
        return { success: false, error: `Failed to load XML content from ${targetFile}` };
      }
      
      logAdminAction('Loaded XML content', { 
        productId, 
        targetFile, 
        xmlLength: xmlContent.length 
      });
      
      // Validate XML before parsing
      const validationResult = this.validateXML(xmlContent);
      if (!validationResult.isValid) {
        logAdminAction('XML validation failed during load', { 
          productId, 
          error: validationResult.error 
        }, 'ERROR');
        return { success: false, error: 'Invalid XML structure in loaded file' };
      }

      const parsedProduct = this.parseProductXML(xmlContent);
      
      if (parsedProduct) {
        logAdminAction('Successfully loaded and parsed product XML', { 
          productId, 
          targetFile,
          productName: parsedProduct.name
        });
        return { success: true, data: parsedProduct };
      } else {
        logAdminAction('Failed to parse XML content', { productId, targetFile }, 'ERROR');
        return { success: false, error: 'Failed to parse XML content' };
      }
    } catch (error) {
      logAdminAction('Error loading product XML', { productId, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Load a specific version of a product XML
  async loadProductXMLVersion(productId: string, version: string): Promise<XMLOperationResult> {
    try {
      logAdminAction('Loading product XML version', { productId, version });
      
      const versionPath = `public/data/product/versions/${version}`;
      const xmlContent = await storageService.load(versionPath);
      
      if (!xmlContent) {
        logAdminAction('Failed to load XML version', { productId, version, versionPath }, 'ERROR');
        return { success: false, error: `Failed to load XML version from ${versionPath}` };
      }
      
      // Validate XML before parsing
      const validationResult = this.validateXML(xmlContent);
      if (!validationResult.isValid) {
        logAdminAction('XML version validation failed', { 
          productId, 
          version, 
          error: validationResult.error 
        }, 'ERROR');
        return { success: false, error: 'Invalid XML structure in version file' };
      }

      const parsedProduct = this.parseProductXML(xmlContent);
      
      if (parsedProduct) {
        logAdminAction('Successfully loaded product XML version', { 
          productId, 
          version,
          productName: parsedProduct.name
        });
        return { success: true, data: parsedProduct };
      } else {
        logAdminAction('Failed to parse XML version content', { productId, version }, 'ERROR');
        return { success: false, error: 'Failed to parse XML version content' };
      }
    } catch (error) {
      logAdminAction('Error loading product XML version', { productId, version, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // List available versions for a product
  async listProductXMLVersions(productId: string): Promise<XMLOperationResult> {
    try {
      logAdminAction('Listing product XML versions', { productId });
      
      const versions = await storageService.list(`public/data/product/versions/`);
      const productVersions = versions.filter(v => v.includes(`-${productId}_`));
      
      logAdminAction('Found product XML versions', { 
        productId, 
        versionCount: productVersions.length,
        versions: productVersions
      });
      
      return { 
        success: true, 
        data: productVersions.sort().reverse() // Newest first
      };
    } catch (error) {
      logAdminAction('Error listing product XML versions', { productId, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Publish XML files to public storage
  async publishPortfolioXMLs(portfolios: Portfolio[]): Promise<XMLOperationResult> {
    try {
      logAdminAction('Starting to publish portfolio XMLs', { 
        portfoliosCount: portfolios.length,
        totalProductsCount: portfolios.reduce((sum, p) => sum + p.products.length, 0)
      });
      
      const publishItems: Array<{ path: string; content: string }> = [];

      // Generate individual product XMLs
      for (const portfolio of portfolios) {
        logAdminAction('Processing portfolio for publishing', { 
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          productsCount: portfolio.products.length
        });
        
        for (const product of portfolio.products) {
          const xmlContent = this.generateProductXML(product);
          
          logAdminAction('Generated XML for product publishing', { 
            productId: product.id,
            productName: product.name,
            xmlLength: xmlContent.length
          });
          
          // Validate XML before publishing
          const validationResult = this.validateXML(xmlContent);
          if (!validationResult.isValid) {
            logAdminAction('Product XML validation failed during publishing', { 
              productId: product.id, 
              error: validationResult.error 
            }, 'ERROR');
            continue;
          }
          
          const safeName = product.name.replace(/[^\w\-]/g, '-');
          const path = `${safeName}-${product.id}.xml`;
          publishItems.push({ path: `published/${path}`, content: xmlContent }); // Add 'published/' prefix
        }
      }

      // Generate combined portfolio XML
      const allProductsXML = this.generatePortfolioXML(portfolios);
      
      logAdminAction('Generated combined portfolio XML', { 
        xmlLength: allProductsXML.length,
        portfoliosCount: portfolios.length
      });
      
      // Validate combined XML before publishing
      const combinedValidation = this.validateXML(allProductsXML);
      if (!combinedValidation.isValid) {
        logAdminAction('Combined XML validation failed during publishing', { 
          error: combinedValidation.error 
        }, 'ERROR');
        return { 
          success: false, 
          error: 'Invalid combined XML structure generated' 
        };
      }
      
      publishItems.push({ path: 'published/all-products.xml', content: allProductsXML }); // Add 'published/' prefix

      // Publish each item using storageService
      const results = [];
      let successCount = 0;
      
      for (const item of publishItems) {
        try {
          const success = await storageService.publish(item.path, item.content);
            
          if (!success) {
            console.error(`Error publishing ${item.path}`);
            results.push({ path: item.path, success: false, error: "Failed to publish" });
          } else {
            console.log(`Successfully published: ${item.path}`);
            results.push({ path, success: true, data: item.path });
            successCount++;
          }
        } catch (itemError) {
          console.error(`Exception publishing ${item.path}:`, itemError);
          results.push({ 
            path: item.path, 
            success: false, 
            error: itemError instanceof Error ? itemError.message : 'Unknown error' 
          });
        }
      }

      if (successCount > 0) {
        logAdminAction('Successfully published XML files', { 
          publishedCount: successCount,
          totalCount: publishItems.length
        });
        return { 
          success: true, 
          data: { 
            publishedCount: successCount,
            totalCount: publishItems.length,
            results,
            paths: publishItems.map(item => item.path)
          } 
        };
      } else {
        logAdminAction('All XML files failed to publish', {}, 'ERROR');
        return { 
          success: false, 
          error: 'Failed to publish any files' 
        };
      }
    } catch (error) {
      logAdminAction('Error publishing portfolio XMLs', { error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Publish a single product XML
  async publishProductXML(productId: string, product: Product): Promise<XMLOperationResult> {
    try {
      logAdminAction('Starting to publish single product XML', { 
        productId, 
        productName: product.name 
      });
      
      const xmlContent = this.generateProductXML(product);
      
      logAdminAction('Generated XML content for publishing', { 
        productId, 
        xmlLength: xmlContent.length 
      });
      
      // Validate XML before publishing
      const validationResult = this.validateXML(xmlContent);
      if (!validationResult.isValid) {
        logAdminAction('XML validation failed during single product publishing', { 
          productId, 
          error: validationResult.error 
        }, 'ERROR');
        return { success: false, error: 'Invalid XML structure generated' };
      }
      
      const safeName = product.name.replace(/[^\w\-]/g, '-');
      const path = `${safeName}-${product.id}.xml`;
      
      // Publish using storageService
      const success = await storageService.publish(`published/${path}`, xmlContent); // Add 'published/' prefix

      if (!success) {
        logAdminAction('Error publishing single product XML', { 
          productId, 
          error: "Failed to publish" 
        }, 'ERROR');
        return { success: false, error: "Failed to publish" };
      }

      logAdminAction('Successfully published single product XML', { 
        productId, 
        path: `published/${path}` 
      });
      return { success: true, data: { path: `published/${path}` } };
    } catch (error) {
      logAdminAction('Error publishing single product XML', { productId, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get list of published XMLs
  async getPublishedXMLs(): Promise<XMLOperationResult> {
    try {
      logAdminAction('Getting list of published XMLs', {});
      
      // Use storageService to list files in the 'published' prefix
      const files = await storageService.list('published');
      
      logAdminAction('Retrieved published XMLs list', { 
        filesCount: files.length,
        files: files
      });
      
      return { success: true, data: files };
    } catch (error) {
      logAdminAction('Error getting published XMLs list', { error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Load published XML content
  async getPublishedXML(filename: string): Promise<XMLOperationResult> {
    try {
      logAdminAction('Getting published XML content', { filename });
      
      // Use storageService to load the content from the 'published' prefix
      const content = await storageService.load(`published/${filename}`);
        
      if (!content) {
        logAdminAction('No data returned for published XML', { filename }, 'ERROR');
        return { success: false, error: 'No data returned' };
      }
      
      logAdminAction('Successfully retrieved published XML content', { 
        filename, 
        contentLength: content.length 
      });
      return { success: true, data: content };
    } catch (error) {
      logAdminAction('Error getting published XML', { filename, error }, 'ERROR');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Enhanced XML validation with detailed error reporting
  private validateXML(xmlString: string): { isValid: boolean; error?: string } {
    try {
      logAdminAction('Starting XML validation', { xmlLength: xmlString.length });
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        const errorText = parseError.textContent || 'Unknown parsing error';
        logAdminAction('XML parsing error detected', { 
          error: errorText,
          xmlPreview: xmlString.substring(0, 1000)
        }, 'ERROR');
        return { isValid: false, error: errorText };
      }
      
      // Additional validation checks
      const rootElement = xmlDoc.documentElement;
      if (!rootElement) {
        logAdminAction('No root element found in XML', {}, 'ERROR');
        return { isValid: false, error: 'No root element found in XML' };
      }
      
      logAdminAction('XML validation passed', { rootElementName: rootElement.tagName });
      return { isValid: true };
    } catch (error) {
      logAdminAction('XML validation exception', { error }, 'ERROR');
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
    }
  }

  // Generate XML content for a single product with enhanced logging
  generateProductXML(product: Product): string {
    logAdminAction('Starting XML generation for product', { 
      productId: product.id, 
      productName: product.name 
    });
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += `<Product id="${escapeXml(product.id)}" name="${escapeXml(product.name)}" description="${escapeXml(product.description || '')}">\n`;
    
    // Add metrics
    if (product.metrics && product.metrics.length > 0) {
      logAdminAction('Adding metrics to XML', { 
        productId: product.id, 
        metricsCount: product.metrics.length 
      });
      xml += '  <Metrics>\n';
      product.metrics.forEach((metric, index) => {
        logAdminAction('Processing metric for XML', { 
          productId: product.id, 
          metricIndex: index,
          metricId: metric.id,
          metricName: metric.name
        });
        
        xml += `    <Metric id="${escapeXml(metric.id)}" month="${metric.month}" year="${metric.year}" createdAt="${metric.createdAt}" version="${metric.version}">\n`;
        metric.metricItems.forEach((item: MetricItem, itemIndex: number) => {
          xml += `      <MetricItem id="${escapeXml(item.id)}" name="${escapeXml(item.name)}" value="${item.value}" previousValue="${item.previousValue || 0}" unit="${escapeXml(item.unit)}" timestamp="${item.timestamp}" description="${escapeXml(item.description || '')}"`;
          if (item.monthlyTarget !== undefined) xml += ` monthlyTarget="${item.monthlyTarget}"`;
          if (item.annualTarget !== undefined) xml += ` annualTarget="${item.annualTarget}"`;
          if (item.status) xml += ` status="${item.status}"`;
          if (item.notes) xml += ` notes="${escapeXml(item.notes)}"`;
          if (item.source) xml += ` source="${escapeXml(item.source)}"`;
          if (item.category) xml += ` category="${escapeXml(item.category)}"`;
          if (item.owner) xml += ` owner="${escapeXml(item.owner)}"`;
          xml += '/>\n';
        });
        xml += '    </Metric>\n';
      });
      xml += '  </Metrics>\n';
    }
    
    // Add roadmap
    if (product.roadmap && product.roadmap.length > 0) {
      logAdminAction('Adding roadmap to XML', { 
        productId: product.id, 
        roadmapCount: product.roadmap.length 
      });
      xml += '  <Roadmaps>\n';
      product.roadmap.forEach((roadmap, index) => {
        logAdminAction('Processing roadmap item for XML', { 
          productId: product.id, 
          roadmapIndex: index,
          roadmapId: roadmap.id,
          roadmapTitle: roadmap.title
        });
        
        xml += `    <Roadmap id="${escapeXml(roadmap.id)}" year="${roadmap.year}" quarter="${roadmap.quarter}" title="${escapeXml(roadmap.title)}" description="${escapeXml(roadmap.description)}" status="${roadmap.status}" createdAt="${roadmap.createdAt}" version="${roadmap.version}"`;
        if (roadmap.link) xml += ` link="${escapeXml(roadmap.link)}"`;
        xml += '/>\n';
      });
      xml += '  </Roadmaps>\n';
    }
    
    // Add release goals
    if (product.releaseGoals && product.releaseGoals.length > 0) {
      logAdminAction('Adding release goals to XML', { 
        productId: product.id, 
        goalsCount: product.releaseGoals.length 
      });
      xml += '  <ReleaseGoals>\n';
      product.releaseGoals.forEach((goal, index) => {
        logAdminAction('Processing release goal for XML', { 
          productId: product.id, 
          goalIndex: index,
          goalId: goal.id,
          goalItemsCount: goal.goals?.length || 0
        });
        
        xml += `    <ReleaseGoal id="${escapeXml(goal.id)}" month="${goal.month}" year="${goal.year}" createdAt="${goal.createdAt}" version="${goal.version}">\n`;
        
        // Add Goals items if they exist
        if (goal.goals && goal.goals.length > 0) {
          xml += '      <Goals>\n';
          goal.goals.forEach((item, itemIndex) => {
            logAdminAction('Processing goal item for XML', { 
              productId: product.id, 
              goalIndex: index,
              itemIndex: itemIndex,
              itemId: item.id
            });
            
            xml += `        <GoalItem id="${escapeXml(item.id)}" description="${escapeXml(item.description)}" currentState="${escapeXml(item.currentState)}" targetState="${escapeXml(item.targetState)}"`;
            if (item.status) xml += ` status="${item.status}"`;
            if (item.owner) xml += ` owner="${escapeXml(item.owner)}"`;
            if (item.priority) xml += ` priority="${escapeXml(item.priority)}"`;
            if (item.category) xml += ` category="${escapeXml(item.category)}"`;
            xml += ' />\n';
          });
          xml += '      </Goals>\n';
        } else {
          // Add legacy format attributes
          xml += `      <Goals>\n`;
          xml += `        <GoalItem id="${escapeXml(goal.id)}-item-1" description="${escapeXml(goal.description || '')}" currentState="${escapeXml(goal.currentState || '')}" targetState="${escapeXml(goal.targetState || '')}"`;
          if (goal.status) xml += ` status="${goal.status}"`;
          if (goal.owner) xml += ` owner="${escapeXml(goal.owner || '')}"`;
          if (goal.priority) xml += ` priority="${escapeXml(goal.priority || '')}"`;
          if (goal.category) xml += ` category="${escapeXml(goal.category || '')}"`;
          xml += ' />\n';
          xml += `      </Goals>\n`;
        }
        
        xml += '    </ReleaseGoal>\n';
      });
      xml += '  </ReleaseGoals>\n';
    }
    
    // Add release plans
    if (product.releasePlans && product.releasePlans.length > 0) {
      logAdminAction('Adding release plans to XML', { 
        productId: product.id, 
        plansCount: product.releasePlans.length 
      });
      xml += '  <ReleasePlans>\n';
      product.releasePlans.forEach((plan, index) => {
        logAdminAction('Processing release plan for XML', { 
          productId: product.id, 
          planIndex: index,
          planId: plan.id,
          planItemsCount: plan.items?.length || 0
        });
        
        xml += `    <ReleasePlan id="${escapeXml(plan.id)}" month="${plan.month}" year="${plan.year}" createdAt="${plan.createdAt}" version="${plan.version}">\n`;
        
        // Add plan items if they exist
        if (plan.items && plan.items.length > 0) {
          xml += '      <ReleasePlanItems>\n';
          plan.items.forEach((item, itemIndex) => {
            logAdminAction('Processing plan item for XML', { 
              productId: product.id, 
              planIndex: index,
              itemIndex: itemIndex,
              itemId: item.id
            });
            
            xml += `        <ReleasePlanItem id="${escapeXml(item.id)}" title="${escapeXml(item.title)}" description="${escapeXml(item.description || '')}"`;
            if (item.category) xml += ` category="${escapeXml(item.category)}"`;
            if (item.priority) xml += ` priority="${escapeXml(item.priority)}"`;
            if (item.source) xml += ` source="${escapeXml(item.source)}"`;
            if (item.targetDate) xml += ` targetDate="${item.targetDate}"`;
            if (item.owner) xml += ` owner="${escapeXml(item.owner || '')}"`;
            if (item.status) xml += ` status="${item.status}"`;
            xml += ' />\n';
          });
          xml += '      </ReleasePlanItems>\n';
        } else {
          // If no nested items, create one from the parent attributes
          xml += `      <ReleasePlanItems>\n`;
          xml += `        <ReleasePlanItem id="${escapeXml(plan.id)}-item-1" title="${escapeXml(plan.title || '')}" description="${escapeXml(plan.description || '')}"`;
          if (plan.category) xml += ` category="${escapeXml(plan.category)}"`;
          if (plan.priority) xml += ` priority="${escapeXml(plan.priority)}"`;
          if (plan.source) xml += ` source="${escapeXml(plan.source)}"`;
          if (plan.targetDate) xml += ` targetDate="${plan.targetDate}"`;
          if (plan.owner) xml += ` owner="${escapeXml(plan.owner || '')}"`;
          if (plan.status) xml += ` status="${plan.status}"`;
          xml += ' />\n';
          xml += `      </ReleasePlanItems>\n`;
        }
        
        xml += '    </ReleasePlan>\n';
      });
      xml += '  </ReleasePlans>\n';
    }
    
    // Add release notes
    if (product.releaseNotes && product.releaseNotes.length > 0) {
      logAdminAction('Adding release notes to XML', { 
        productId: product.id, 
        notesCount: product.releaseNotes.length 
      });
      xml += '  <ReleaseNotes>\n';
      product.releaseNotes.forEach((note, index) => {
        logAdminAction('Processing release note for XML', { 
          productId: product.id, 
          noteIndex: index,
          noteId: note.id,
          noteTitle: note.title
        });
        
        xml += `    <ReleaseNote id="${escapeXml(note.id)}" month="${note.month}" year="${note.year}" title="${escapeXml(note.title || '')}" description="${escapeXml(note.description || '')}" type="${note.type}" highlights="${escapeXml(note.highlights || '')}" createdAt="${note.createdAt}" version="${note.version}"`;
        if (note.link) xml += ` link="${escapeXml(note.link)}"`;
        xml += '/>\n';
      });
      xml += '  </ReleaseNotes>\n';
    }

    // Add objectives (OKRs)
    if (product.objectives && product.objectives.length > 0) {
      logAdminAction('Adding objectives to XML', {
        productId: product.id,
        objectivesCount: product.objectives.length
      });
      xml += '  <Objectives>\n';
      product.objectives.forEach((objective, index) => {
        logAdminAction('Processing objective for XML', {
          productId: product.id,
          objectiveIndex: index,
          objectiveId: objective.id,
          objectiveTitle: objective.title
        });

        xml += `    <Objective id="${escapeXml(objective.id)}" title="${escapeXml(objective.title)}" description="${escapeXml(objective.description)}" productId="${escapeXml(objective.productId)}" status="${objective.status}" priority="${objective.priority}" createdAt="${objective.createdAt}" version="${objective.version}">\n`;
        
        // Add Initiatives
        if (objective.initiatives && objective.initiatives.length > 0) {
          xml += '      <Initiatives>\n';
          objective.initiatives.forEach((initiative, initIndex) => {
            xml += `        <Initiative id="${escapeXml(initiative.id)}" title="${escapeXml(initiative.title)}" description="${escapeXml(initiative.description)}" targetDate="${escapeXml(initiative.targetDate)}" status="${initiative.status}" progress="${initiative.progress}"/>\n`;
          });
          xml += '      </Initiatives>\n';
        }

        // Add ExpectedBenefits
        if (objective.expectedBenefits && objective.expectedBenefits.length > 0) {
          xml += '      <ExpectedBenefits>\n';
          objective.expectedBenefits.forEach((benefit, benefitIndex) => {
            xml += `        <Benefit id="${escapeXml(benefit.id)}" title="${escapeXml(benefit.title)}" description="${escapeXml(benefit.description)}" targetValue="${escapeXml(benefit.targetValue)}" metricType="${escapeXml(benefit.metricType)}" status="${benefit.status}"/>\n`;
          });
          xml += '      </ExpectedBenefits>\n';
        }

        xml += '    </Objective>\n';
      });
      xml += '  </Objectives>\n';
    }
    
    xml += '</Product>';
    
    logAdminAction('Completed XML generation for product', { 
      productId: product.id, 
      finalXmlLength: xml.length 
    });
    
    return xml;
  }

  // Generate XML content for portfolios with enhanced logging
  generatePortfolioXML(portfolios: Portfolio[]): string {
    logAdminAction('Starting portfolio XML generation', { 
      portfoliosCount: portfolios.length 
    });
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<ProductPortal>\n  <Portfolios>\n';
    
    portfolios.forEach((portfolio, portfolioIndex) => {
      logAdminAction('Processing portfolio for XML', { 
        portfolioIndex,
        portfolioId: portfolio.id,
        portfolioName: portfolio.name,
        productsCount: portfolio.products.length
      });
      
      xml += `    <Portfolio id="${escapeXml(portfolio.id)}" name="${escapeXml(portfolio.name)}">\n`;
      xml += '      <Products>\n';
      
      portfolio.products.forEach((product, productIndex) => {
        logAdminAction('Processing product reference for portfolio XML', { 
          portfolioIndex,
          productIndex,
          productId: product.id,
          productName: product.name
        });
        
        // Use platform-independent path separators
        const filepath = `public/data/product/${product.name.replace(/\s+/g, '-')}-${product.id}.xml`.replace(/\\/g, '/');
        xml += `        <Product id="${escapeXml(product.id)}" name="${escapeXml(product.name)}" description="${escapeXml(product.description || '')}" filepath="${filepath}"/>\n`;
      });
      
      xml += '      </Products>\n';
      xml += '    </Portfolio>\n';
    });
    
    xml += '  </Portfolios>\n</ProductPortal>';
    
    logAdminAction('Completed portfolio XML generation', { 
      finalXmlLength: xml.length 
    });
    
    return xml;
  }

  // Parse XML content to product object with enhanced logging
  private parseProductXML(xmlContent: string): Product | null {
    try {
      logAdminAction('Starting product XML parsing', { xmlLength: xmlContent.length });
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, 'text/xml');
      
      // Check for parsing errors
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        logAdminAction('XML parsing error during product parse', { 
          error: parseError.textContent 
        }, 'ERROR');
        return null;
      }
      
      // Updated selector to handle both direct Product elements and nested ones
      const productEl = xmlDoc.querySelector('Product, ProductPortal > Portfolios > Portfolio > Products > Product');
      if (!productEl) {
        logAdminAction('No Product element found in XML', {}, 'ERROR');
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
        releaseNotes: [],
        objectives: [] // Initialize objectives array
      };
      
      logAdminAction('Found product element', { 
        productId: product.id,
        productName: product.name
      });
      
      // Parse metrics
      const metricElements = xmlDoc.querySelectorAll('Metrics > Metric');
      metricElements.forEach((metricEl, index) => {
        logAdminAction('Parsing metric element', { 
          productId: product.id,
          metricIndex: index,
          metricId: metricEl.getAttribute('id')
        });
        
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
        metricItemElements.forEach((itemEl, itemIndex) => {
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
      
      // Parse roadmap
      const roadmapElements = xmlDoc.querySelectorAll('Roadmap, Roadmaps > Roadmap');
      roadmapElements.forEach((roadmapEl, index) => {
        logAdminAction('Parsing roadmap element', { 
          productId: product.id,
          roadmapIndex: index,
          roadmapId: roadmapEl.getAttribute('id')
        });
        
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
      const goalElements = xmlDoc.querySelectorAll('ReleaseGoal, ReleaseGoals > ReleaseGoal');
      goalElements.forEach((goalEl, index) => {
        logAdminAction('Parsing release goal element', { 
          productId: product.id,
          goalIndex: index,
          goalId: goalEl.getAttribute('id')
        });
        
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
          goalItemElements.forEach((itemEl, itemIndex) => {
            logAdminAction('Parsing goal item element', { 
              productId: product.id,
              goalIndex: index,
              itemIndex: itemIndex,
              itemId: itemEl.getAttribute('id')
            });
            
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
      const planElements = xmlDoc.querySelectorAll('ReleasePlan, ReleasePlans > ReleasePlan');
      planElements.forEach((planEl, index) => {
        logAdminAction('Parsing release plan element', { 
          productId: product.id,
          planIndex: index,
          planId: planEl.getAttribute('id')
        });
        
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
          planItemElements.forEach((itemEl, itemIndex) => {
            logAdminAction('Parsing plan item element', { 
              productId: product.id,
              planIndex: index,
              itemIndex: itemIndex,
              itemId: itemEl.getAttribute('id')
            });
            
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
      const noteElements = xmlDoc.querySelectorAll('ReleaseNote, ReleaseNotes > ReleaseNote');
      noteElements.forEach((noteEl, index) => {
        logAdminAction('Parsing release note element', { 
          productId: product.id,
          noteIndex: index,
          noteId: noteEl.getAttribute('id')
        });
        
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

      // Parse objectives (OKRs)
      const objectiveElements = xmlDoc.querySelectorAll('Objectives > Objective');
      objectiveElements.forEach((objectiveEl, index) => {
        logAdminAction('Parsing objective element', {
          productId: product.id,
          objectiveIndex: index,
          objectiveId: objectiveEl.getAttribute('id')
        });

        const objective: ProductObjective = {
          id: objectiveEl.getAttribute('id') || '',
          title: objectiveEl.getAttribute('title') || '',
          description: objectiveEl.getAttribute('description') || '',
          productId: objectiveEl.getAttribute('productId') || '',
          status: (objectiveEl.getAttribute('status') || 'Not Started') as 'Not Started' | 'In Progress' | 'Completed',
          priority: parseInt(objectiveEl.getAttribute('priority') || '1'),
          createdAt: objectiveEl.getAttribute('createdAt') || '',
          version: parseInt(objectiveEl.getAttribute('version') || '1'),
          initiatives: [],
          expectedBenefits: []
        };

        // Parse Initiatives
        const initiativeElements = objectiveEl.querySelectorAll('Initiatives > Initiative');
        initiativeElements.forEach((initEl, initIndex) => {
          objective.initiatives.push({
            id: initEl.getAttribute('id') || '',
            title: initEl.getAttribute('title') || '',
            description: initEl.getAttribute('description') || '',
            targetDate: initEl.getAttribute('targetDate') || '',
            status: (initEl.getAttribute('status') || 'Not Started') as 'Not Started' | 'In Progress' | 'Completed',
            progress: parseInt(initEl.getAttribute('progress') || '0')
          });
        });

        // Parse ExpectedBenefits
        const benefitElements = objectiveEl.querySelectorAll('ExpectedBenefits > Benefit');
        benefitElements.forEach((benefitEl, benefitIndex) => {
          objective.expectedBenefits.push({
            id: benefitEl.getAttribute('id') || '',
            title: benefitEl.getAttribute('title') || '',
            description: benefitEl.getAttribute('description') || '',
            targetValue: benefitEl.getAttribute('targetValue') || '',
            metricType: benefitEl.getAttribute('metricType') || '',
            status: (benefitEl.getAttribute('status') || 'Not Started') as 'Not Started' | 'In Progress' | 'Completed'
          });
        });
        product.objectives.push(objective);
      });
      
      logAdminAction('Completed product XML parsing', { 
        productId: product.id,
        productName: product.name,
        metricsCount: product.metrics.length,
        roadmapCount: product.roadmap.length,
        goalsCount: product.releaseGoals.length,
        plansCount: product.releasePlans.length,
        notesCount: product.releaseNotes.length,
        objectivesCount: product.objectives.length
      });
      
      return product;
    } catch (error) {
      logAdminAction('Error parsing product XML content', { error }, 'ERROR');
      return null;
    }
  }
}

// Export singleton instance
export const xmlApiService = XMLApiService.getInstance();
