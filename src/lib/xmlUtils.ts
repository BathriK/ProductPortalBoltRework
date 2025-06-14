// src/lib/xmlUtils.ts
import { getPortfolios, updatePortfolios, findProductById, portfoliosToXML, parseXMLConfig, generateSampleData, escapeXml } from './data';
import { format } from 'date-fns';
import { Product } from './types';
import { storageService } from '../services/storageService'; // Import storageService
import { adminLogger } from './adminLogger';

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`xmlUtils: ${action}`, details, level);
}

// Save product data to XML file in data/product folder with versioning
export async function saveProductToXML(productId: string): Promise<boolean> {
  try {
    logAdminAction('saveProductToXML: Starting save operation', { productId });
    
    const { product, portfolio } = await findProductById(productId);
    
    if (!product || !portfolio) {
      logAdminAction('saveProductToXML: Product not found', { productId }, 'ERROR');
      return false;
    }
    
    logAdminAction('saveProductToXML: Found product', { 
      productId, 
      productName: product.name, 
      portfolioName: portfolio.name,
      metricsCount: product.metrics?.length || 0,
      goalsCount: product.releaseGoals?.length || 0,
      plansCount: product.releasePlans?.length || 0,
      notesCount: product.releaseNotes?.length || 0
    });
    
    // Create XML content for individual product
    const xml = generateProductXML(product);
    
    logAdminAction('saveProductToXML: Generated XML content', { 
      productId, 
      xmlLength: xml.length,
      xmlPreview: xml.substring(0, 500) + (xml.length > 500 ? '...' : '')
    });
    
    // Validate XML structure before saving
    const validationResult = validateXML(xml);
    if (!validationResult.isValid) {
      logAdminAction('saveProductToXML: XML validation failed', { 
        productId, 
        error: validationResult.error,
        xmlContent: xml
      }, 'ERROR');
      return false;
    }
    
    logAdminAction('saveProductToXML: XML validation passed', { productId });
    
    // Create versioned filename with timestamp
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const safeName = product.name.replace(/[^\w\-]/g, '-');
    // const baseFilename = `${safeName}-${product.id}`;
    const baseFilename = `${product.id}`;
    const versionedFilename = `${baseFilename}_${timestamp}.xml`;
    const currentFilename = `${baseFilename}.xml`;
    
    const basePath = 'public/data/product/';
    const versionedPath = `${basePath}versions/${versionedFilename}`;
    const currentPath = `${basePath}${currentFilename}`;
    
    // Save both current and versioned copies using storageService
    const saveCurrentSuccess = await storageService.save(currentPath, xml);
    const saveVersionedSuccess = await storageService.save(versionedPath, xml);

    if (!saveCurrentSuccess || !saveVersionedSuccess) {
      logAdminAction('saveProductToXML: Failed to save product XML to storage', { 
        productId, 
        currentPath, 
        versionedPath,
        saveCurrentSuccess,
        saveVersionedSuccess
      }, 'ERROR');
      return false;
    }
    logAdminAction('saveProductToXML: Saved current and versioned XML', { currentPath, versionedPath });
    
    // Also update the combined XML file
    try {
      logAdminAction('saveProductToXML: Updating combined XML file', {});
      const portfolios = await getPortfolios();
      const allProductsXML = portfoliosToXML(portfolios);
      
      logAdminAction('saveProductToXML: Generated combined XML', { 
        xmlLength: allProductsXML.length,
        portfoliosCount: portfolios.length,
        totalProductsCount: portfolios.reduce((sum, p) => sum + p.products.length, 0)
      });
      
      // Validate combined XML
      const combinedValidation = validateXML(allProductsXML);
      if (!combinedValidation.isValid) {
        logAdminAction('saveProductToXML: Combined XML validation failed', { 
          error: combinedValidation.error,
          xmlContent: allProductsXML
        }, 'ERROR');
        return false;
      }
      
      logAdminAction('saveProductToXML: Combined XML validation passed', {});
      
      const saveCombinedSuccess = await storageService.save('public/data/PortfolioProduct.xml', allProductsXML);
      if (saveCombinedSuccess) {
        logAdminAction('saveProductToXML: Updated combined XML file', {});
      } else {
        logAdminAction('saveProductToXML: Failed to update combined XML file', {}, 'ERROR');
      }
    } catch (error) {
      logAdminAction('saveProductToXML: Combined XML update failed', { error }, 'ERROR');
      // Continue even if combined XML update fails
    }
    
    logAdminAction('saveProductToXML: Save operation completed successfully', { productId });
    return true;
  } catch (error) {
    logAdminAction('saveProductToXML: Save operation failed', { productId, error }, 'ERROR');
    return false;
  }
}

// Enhanced XML validation with detailed error reporting
function validateXML(xmlString: string): { isValid: boolean; error?: string } {
  try {
    logAdminAction('validateXML: Starting validation', { xmlLength: xmlString.length });
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
    
    // Check for parsing errors
    const parseError = xmlDoc.querySelector('parsererror');
    if (parseError) {
      const errorText = parseError.textContent || 'Unknown parsing error';
      logAdminAction('validateXML: Parsing error detected', { 
        error: errorText,
        xmlPreview: xmlString.substring(0, 1000)
      }, 'ERROR');
      return { isValid: false, error: errorText };
    }
    
    // Additional validation checks
    const rootElement = xmlDoc.documentElement;
    if (!rootElement) {
      logAdminAction('validateXML: No root element found', {}, 'ERROR');
      return { isValid: false, error: 'No root element found in XML' };
    }
    
    logAdminAction('validateXML: Validation passed', { rootElementName: rootElement.tagName });
    return { isValid: true };
  } catch (error) {
    logAdminAction('validateXML: Validation exception', { error }, 'ERROR');
    return { isValid: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
  }
}

// Load product data from XML file in data/product folder
export async function loadProductFromXML(productId: string): Promise<boolean> {
  try {
    logAdminAction('loadProductFromXML: Starting load operation', { productId });
    
    const basePath = 'public/data/product/';
    
    // Find the file by listing available files for the product
    const availableFiles = await storageService.list(basePath);
    const targetFile = availableFiles.find(file => file.includes(`-${productId}.xml`));
    
    if (!targetFile) {
      logAdminAction('loadProductFromXML: No XML file found', { productId }, 'WARN');
      return false;
    }
    
    const xmlContent = await storageService.load(targetFile);
    if (!xmlContent) {
      logAdminAction('loadProductFromXML: Empty XML content', { productId, targetFile }, 'WARN');
      return false;
    }
    
    logAdminAction('loadProductFromXML: Found XML file', { 
      productId, 
      targetFile, 
      xmlLength: xmlContent.length 
    });
    
    // Validate XML before parsing
    const validationResult = validateXML(xmlContent);
    if (!validationResult.isValid) {
      logAdminAction('loadProductFromXML: XML validation failed', { 
        productId, 
        error: validationResult.error 
      }, 'ERROR');
      return false;
    }
    
    // Parse XML and update product data
    const parsedProduct = parseProductXMLContent(xmlContent);
    if (parsedProduct) {
      // Update the product in the portfolios
      const portfolios = await getPortfolios();
      const updatedPortfolios = portfolios.map(portfolio => ({
        ...portfolio,
        products: portfolio.products.map(p => 
          p.id === productId ? parsedProduct : p
        )
      }));
      
      updatePortfolios(updatedPortfolios);
      logAdminAction('loadProductFromXML: Successfully loaded and updated product', { productId });
      return true;
    }
    
    logAdminAction('loadProductFromXML: Failed to parse XML content', { productId }, 'ERROR');
    return false;
  } catch (error) {
    logAdminAction('loadProductFromXML: Load operation failed', { productId, error }, 'ERROR');
    return false;
  }
}

// Get all versions of a product XML file
export async function getProductXMLVersions(productId: string): Promise<string[]> {
  try {
    logAdminAction('getProductXMLVersions: Listing versions', { productId });
    
    const basePath = 'public/data/product/versions/';
    const versionFiles = await storageService.list(basePath);
    
    // Filter for versions of the specific product
    const productVersions = versionFiles.filter(file => 
      file.includes(`-${productId}_`) && file.endsWith('.xml')
    );
    
    logAdminAction('getProductXMLVersions: Found versions', { 
      productId, 
      versionCount: productVersions.length,
      versions: productVersions
    });
    
    // Sort by timestamp (newest first)
    return productVersions.sort().reverse();
  } catch (error) {
    logAdminAction('getProductXMLVersions: Failed to list versions', { productId, error }, 'ERROR');
    return [];
  }
}

// Load a specific version of a product XML file
export async function loadProductXMLVersion(versionPath: string): Promise<Product | null> {
  try {
    logAdminAction('loadProductXMLVersion: Loading version', { versionPath });
    
    const xmlContent = await storageService.load(versionPath);
    if (!xmlContent) {
      logAdminAction('loadProductXMLVersion: No XML content found', { versionPath }, 'WARN');
      return null;
    }
    
    // Validate XML before parsing
    const validationResult = validateXML(xmlContent);
    if (!validationResult.isValid) {
      logAdminAction('loadProductXMLVersion: XML validation failed', { 
        versionPath, 
        error: validationResult.error 
      }, 'ERROR');
      return null;
    }
    
    const parsedProduct = parseProductXMLContent(xmlContent);
    if (parsedProduct) {
      logAdminAction('loadProductXMLVersion: Successfully loaded version', { 
        versionPath, 
        productName: parsedProduct.name 
      });
    } else {
      logAdminAction('loadProductXMLVersion: Failed to parse version', { versionPath }, 'ERROR');
    }
    
    return parsedProduct;
  } catch (error) {
    logAdminAction('loadProductXMLVersion: Load version failed', { versionPath, error }, 'ERROR');
    return null;
  }
}

// Generate XML content for a single product with enhanced logging
function generateProductXML(product: any): string {
  logAdminAction('generateProductXML: Starting XML generation', { 
    productId: product.id, 
    productName: product.name 
  });
  
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += `<Product id="${escapeXml(product.id)}" name="${escapeXml(product.name)}" description="${escapeXml(product.description || '')}">\n`;
  
  // Add metrics
  if (product.metrics && product.metrics.length > 0) {
    logAdminAction('generateProductXML: Adding metrics', { 
      productId: product.id, 
      metricsCount: product.metrics.length 
    });
    xml += '  <Metrics>\n';
    product.metrics.forEach((metric: any, index: number) => {
      logAdminAction('generateProductXML: Processing metric', { 
        productId: product.id, 
        metricIndex: index,
        metricId: metric.id,
        metricName: metric.name
      });
      
      xml += `    <Metric id="${escapeXml(metric.id)}" name="${escapeXml(metric.name)}" value="${metric.value}" previousValue="${metric.previousValue || 0}" unit="${escapeXml(metric.unit)}" timestamp="${metric.timestamp}" description="${escapeXml(metric.description || '')}" month="${metric.month}" year="${metric.year}"`;
      if (metric.source) xml += ` source="${escapeXml(metric.source)}"`;
      if (metric.category) xml += ` category="${escapeXml(metric.category)}"`;
      if (metric.owner) xml += ` owner="${escapeXml(metric.owner)}"`;
      if (metric.monthlyTarget !== undefined) xml += ` monthlyTarget="${metric.monthlyTarget}"`;
      if (metric.annualTarget !== undefined) xml += ` annualTarget="${metric.annualTarget}"`;
      if (metric.status) xml += ` status="${metric.status}"`;
      if (metric.version) xml += ` version="${metric.version}"`;
      if (metric.notes) xml += ` notes="${escapeXml(metric.notes)}"`;
      xml += '/>\n';
    });
    xml += '  </Metrics>\n';
  }
  
  // Add roadmap
  if (product.roadmap && product.roadmap.length > 0) {
    logAdminAction('generateProductXML: Adding roadmap', { 
      productId: product.id, 
      roadmapCount: product.roadmap.length 
    });
    xml += '  <Roadmaps>\n';
    product.roadmap.forEach((roadmap: any, index: number) => {
      logAdminAction('generateProductXML: Processing roadmap item', { 
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
    logAdminAction('generateProductXML: Adding release goals', { 
      productId: product.id, 
      goalsCount: product.releaseGoals.length 
    });
    xml += '  <ReleaseGoals>\n';
    product.releaseGoals.forEach((goal: any, index: number) => {
      logAdminAction('generateProductXML: Processing release goal', { 
        productId: product.id, 
        goalIndex: index,
        goalId: goal.id,
        goalItemsCount: goal.goals?.length || 0
      });
      
      xml += `    <ReleaseGoal id="${escapeXml(goal.id)}" month="${goal.month}" year="${goal.year}" createdAt="${goal.createdAt}" version="${goal.version}">\n`;
      
      // Add Goals items if they exist
      if (goal.goals && goal.goals.length > 0) {
        xml += '      <Goals>\n';
        goal.goals.forEach((item: any, itemIndex: number) => {
          logAdminAction('generateProductXML: Processing goal item', { 
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
    logAdminAction('generateProductXML: Adding release plans', { 
      productId: product.id, 
      plansCount: product.releasePlans.length 
    });
    xml += '  <ReleasePlans>\n';
    product.releasePlans.forEach((plan: any, index: number) => {
      logAdminAction('generateProductXML: Processing release plan', { 
        productId: product.id, 
        planIndex: index,
        planId: plan.id,
        planItemsCount: plan.items?.length || 0
      });
      
      xml += `    <ReleasePlan id="${escapeXml(plan.id)}" month="${plan.month}" year="${plan.year}" createdAt="${plan.createdAt}" version="${plan.version}">\n`;
      
      // Add plan items if they exist
      if (plan.items && plan.items.length > 0) {
        xml += '      <ReleasePlanItems>\n';
        plan.items.forEach((item: any, itemIndex: number) => {
          logAdminAction('generateProductXML: Processing plan item', { 
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
    logAdminAction('generateProductXML: Adding release notes', { 
      productId: product.id, 
      notesCount: product.releaseNotes.length 
    });
    xml += '  <ReleaseNotes>\n';
    product.releaseNotes.forEach((note: any, index: number) => {
      logAdminAction('generateProductXML: Processing release note', { 
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
  
  xml += '</Product>';
  
  logAdminAction('generateProductXML: Completed XML generation', { 
    productId: product.id, 
    finalXmlLength: xml.length 
  });
  
  return xml;
}

// Generate XML content for portfolios with enhanced logging
function generatePortfolioXML(portfolios: any[]): string {
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
    
    portfolio.products.forEach((product: any, productIndex: number) => {
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
function parseProductXMLContent(xmlContent: string): Product | null {
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
      releaseNotes: []
    };
    
    logAdminAction('Found product element', { 
      productId: product.id,
      productName: product.name
    });
    
    // Parse metrics
    const metricElements = xmlDoc.querySelectorAll('Metric, Metrics > Metric');
    metricElements.forEach((metricEl, index) => {
      logAdminAction('Parsing metric element', { 
        productId: product.id,
        metricIndex: index,
        metricId: metricEl.getAttribute('id')
      });
      
      const metric: any = {
        id: metricEl.getAttribute('id') || '',
        name: metricEl.getAttribute('name') || '',
        value: parseFloat(metricEl.getAttribute('value') || '0'),
        previousValue: parseFloat(metricEl.getAttribute('previousValue') || '0'),
        unit: metricEl.getAttribute('unit') || '',
        timestamp: metricEl.getAttribute('timestamp') || '',
        description: metricEl.getAttribute('description') || '',
        month: parseInt(metricEl.getAttribute('month') || '0'),
        year: parseInt(metricEl.getAttribute('year') || '0'),
        source: metricEl.getAttribute('source') || '',
        category: metricEl.getAttribute('category') || '',
        owner: metricEl.getAttribute('owner') || '',
        monthlyTarget: metricEl.getAttribute('monthlyTarget') ? parseFloat(metricEl.getAttribute('monthlyTarget') || '0') : undefined,
        annualTarget: metricEl.getAttribute('annualTarget') ? parseFloat(metricEl.getAttribute('annualTarget') || '0') : undefined,
        status: (metricEl.getAttribute('status') || 'on-track') as 'on-track' | 'at-risk' | 'off-track',
        version: parseFloat(metricEl.getAttribute('version') || '1.0'),
        notes: metricEl.getAttribute('notes') || ''
      };
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
      
      const roadmap: any = {
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
      
      const releaseGoal: any = {
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
      
      const releasePlan: any = {
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
      
      const releaseNote: any = {
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
    
    logAdminAction('Completed product XML parsing', { 
      productId: product.id,
      productName: product.name,
      metricsCount: product.metrics.length,
      roadmapCount: product.roadmap.length,
      goalsCount: product.releaseGoals.length,
      plansCount: product.releasePlans.length,
      notesCount: product.releaseNotes.length
    });
    
    return product;
  } catch (error) {
    logAdminAction('Error parsing product XML content', { error }, 'ERROR');
    return null;
  }
}

// Export product to XML file
export async function exportProductXML(productId: string): Promise<boolean> {
  try {
    logAdminAction('exportProductXML: Starting export operation', { productId });
    
    const { product } = await findProductById(productId);
    
    if (!product) {
      logAdminAction('exportProductXML: Product not found', { productId }, 'ERROR');
      return false;
    }
    
    const xml = generateProductXML(product);
    
    // Create a blob and trigger download
    const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${product.name.replace(/\s+/g, '-')}-${product.id}.xml`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    logAdminAction('exportProductXML: Export completed successfully', { productId });
    return true;
  } catch (error) {
    logAdminAction('exportProductXML: Export operation failed', { productId, error }, 'ERROR');
    return false;
  }
}

// Export all products to XML files
export async function exportAllProductsXML(): Promise<boolean> {
  try {
    logAdminAction('exportAllProductsXML: Starting export operation', {});
    
    const portfolios = await getPortfolios();
    const allProductsXML = portfoliosToXML(portfolios);
    
    // Create a blob and trigger download
    const blob = new Blob([allProductsXML], { type: 'text/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `all-products.xml`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
    
    logAdminAction('exportAllProductsXML: Export completed successfully', {});
    return true;
  } catch (error) {
    logAdminAction('exportAllProductsXML: Export operation failed', { error }, 'ERROR');
    return false;
  }
}

// Import product from XML file
export async function importProductXML(file: File): Promise<boolean> {
  try {
    logAdminAction('importProductXML: Starting import operation', { fileName: file.name });
    
    // Read the file content
    const xmlContent = await file.text();
    
    // Validate XML before parsing
    const validationResult = validateXML(xmlContent);
    if (!validationResult.isValid) {
      logAdminAction('importProductXML: XML validation failed', { 
        fileName: file.name, 
        error: validationResult.error 
      }, 'ERROR');
      return false;
    }
    
    // Parse XML content
    const parsedProduct = parseProductXMLContent(xmlContent);
    if (!parsedProduct) {
      logAdminAction('importProductXML: Failed to parse XML content', { fileName: file.name }, 'ERROR');
      return false;
    }
    
    // Update the product in the portfolios
    const portfolios = await getPortfolios();
    let productFound = false;
    
    const updatedPortfolios = portfolios.map(portfolio => {
      const updatedProducts = portfolio.products.map(p => {
        if (p.id === parsedProduct.id) {
          productFound = true;
          return parsedProduct;
        }
        return p;
      });
      
      return {
        ...portfolio,
        products: updatedProducts
      };
    });
    
    if (!productFound) {
      logAdminAction('importProductXML: Product not found in existing portfolios', { 
        productId: parsedProduct.id,
        productName: parsedProduct.name
      }, 'WARN');
      
      // Add to the first portfolio as a fallback
      if (updatedPortfolios.length > 0) {
        updatedPortfolios[0].products.push(parsedProduct);
        productFound = true;
      }
    }
    
    if (!productFound) {
      logAdminAction('importProductXML: No portfolios found to add product', {}, 'ERROR');
      return false;
    }
    
    // Save updated portfolios
    updatePortfolios(updatedPortfolios);
    
    // Also save the XML file
    await saveProductToXML(parsedProduct.id);
    
    logAdminAction('importProductXML: Import completed successfully', { 
      productId: parsedProduct.id,
      productName: parsedProduct.name
    });
    return true;
  } catch (error) {
    logAdminAction('importProductXML: Import operation failed', { error }, 'ERROR');
    return false;
  }
}

// List published XML files
export function listPublishedXMLs(): string[] {
  try {
    // In a real implementation, this would fetch from a server
    // For now, we'll return a mock list
    return [
      'all-products.xml',
      'xml-central.xml',
      'mliflow.xml',
      'edit-central.xml'
    ];
  } catch (error) {
    console.error('Error listing published XMLs:', error);
    return [];
  }
}

// Get published XML content
export function getPublishedXML(filename: string): string | null {
  try {
    // In a real implementation, this would fetch from a server
    // For now, we'll return a mock XML string
    return `<?xml version="1.0" encoding="UTF-8"?>\n<Product id="mock" name="Mock Product">\n  <!-- This is a mock XML file for ${filename} -->\n</Product>`;
  } catch (error) {
    console.error('Error getting published XML:', error);
    return null;
  }
}