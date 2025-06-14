// src/services/productEditService.ts
import { Product, ReleaseGoal, ReleasePlan, Metric, ReleaseNote, Roadmap, GoalItem, ReleasePlanItem, ProductObjective } from '../lib/types';
import { xmlApiService } from './xmlApiService';
import { storageService } from './storageService';
import { format } from 'date-fns';
import { adminLogger } from '../lib/adminLogger';
import { getProductObjectives } from './okrService';

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`ProductEditService: ${action}`, details, level);
}

export const saveProductChanges = async (
  productId: string,
  updates: {
    metrics?: Metric[];
    releaseGoals?: ReleaseGoal[];
    releasePlans?: ReleasePlan[];
    releaseNotes?: ReleaseNote[];
    roadmap?: Roadmap[];
    objectives?: ProductObjective[];
  }
): Promise<boolean> => {
  try {
    logAdminAction('Starting save operation', { 
      productId, 
      updateTypes: Object.keys(updates),
      updateCounts: {
        metrics: updates.metrics?.length || 0,
        releaseGoals: updates.releaseGoals?.length || 0,
        releasePlans: updates.releasePlans?.length || 0,
        releaseNotes: updates.releaseNotes?.length || 0,
        roadmap: updates.roadmap?.length || 0,
        objectives: updates.objectives?.length || 0
      }
    });

    // Get existing data from localStorage first for immediate UI updates
    const storedData = localStorage.getItem('portfolios');
    if (!storedData) {
      logAdminAction('No product data found in localStorage', {}, 'ERROR');
      throw new Error('No product data found in localStorage');
    }

    const portfolios = JSON.parse(storedData);
    
    // Find the portfolio and product to update
    let productFound = false;
    let portfolioIndex = -1;
    let productIndex = -1;
    
    for (let i = 0; i < portfolios.length; i++) {
      const portfolio = portfolios[i];
      const pIndex = portfolio.products.findIndex((p: Product) => p.id === productId);
      
      if (pIndex !== -1) {
        portfolioIndex = i;
        productIndex = pIndex;
        productFound = true;
        break;
      }
    }
    
    if (!productFound) {
      logAdminAction('Product not found in portfolios', { productId }, 'ERROR');
      throw new Error(`Product with ID ${productId} not found`);
    }

    const existingProduct = portfolios[portfolioIndex].products[productIndex];
    logAdminAction('Found existing product', { 
      productId, 
      productName: existingProduct.name,
      portfolioIndex,
      productIndex,
      existingCounts: {
        metrics: existingProduct.metrics?.length || 0,
        releaseGoals: existingProduct.releaseGoals?.length || 0,
        releasePlans: existingProduct.releasePlans?.length || 0,
        releaseNotes: existingProduct.releaseNotes?.length || 0,
        roadmap: existingProduct.roadmap?.length || 0,
        objectives: existingProduct.objectives?.length || 0
      }
    });

    // Create a backup of the product before making changes
    const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');
    const backupKey = `product_backup_${productId}_${timestamp}`;
    try {
      localStorage.setItem(backupKey, JSON.stringify(existingProduct));
      logAdminAction('Created product backup', { productId, backupKey });
    } catch (backupError) {
      logAdminAction('Backup creation failed', { productId, error: backupError }, 'WARN');
      // Continue with save operation even if backup fails
    }

    // Process release goals if provided
    if (updates.releaseGoals && updates.releaseGoals.length > 0) {
      logAdminAction('Processing release goals update', { 
        productId, 
        newGoalsCount: updates.releaseGoals.length 
      });
      
      // Get the first release goal from the update (we're assuming a single goal object is passed)
      const newReleaseGoal = updates.releaseGoals[0];
      
      logAdminAction('Processing new release goal', { 
        productId, 
        goalId: newReleaseGoal.id,
        month: newReleaseGoal.month,
        year: newReleaseGoal.year,
        goalsItemsCount: newReleaseGoal.goals?.length || 0
      });
      
      // Find existing goals for the same month/year
      const existingGoals = existingProduct.releaseGoals.filter(
        (g: ReleaseGoal) => g.month === newReleaseGoal.month && g.year === newReleaseGoal.year
      );
      
      if (existingGoals.length > 0) {
        // Find the highest version number
        const highestVersion = Math.max(...existingGoals.map((g: ReleaseGoal) => g.version || 1));
        
        // Set the new version to be one higher than the highest existing version
        newReleaseGoal.version = highestVersion + 1;
        
        logAdminAction('Creating new version of existing release goal', { 
          productId, 
          goalId: newReleaseGoal.id,
          oldVersion: highestVersion,
          newVersion: newReleaseGoal.version
        });
        
        // Add the new version (don't replace)
        existingProduct.releaseGoals.push(newReleaseGoal);
      } else {
        logAdminAction('Adding new release goal', { 
          productId, 
          goalId: newReleaseGoal.id 
        });
        // Add new goals
        existingProduct.releaseGoals.push(newReleaseGoal);
      }
    }
    
    // Process release plans if provided
    if (updates.releasePlans && updates.releasePlans.length > 0) {
      logAdminAction('Processing release plans update', { 
        productId, 
        newPlansCount: updates.releasePlans.length 
      });
      
      // Get the first release plan from the update
      const newReleasePlan = updates.releasePlans[0];
      
      logAdminAction('Processing new release plan', { 
        productId, 
        planId: newReleasePlan.id,
        month: newReleasePlan.month,
        year: newReleasePlan.year,
        planItemsCount: newReleasePlan.items?.length || 0
      });
      
      // Find existing plans for the same month/year
      const existingPlans = existingProduct.releasePlans.filter(
        (p: ReleasePlan) => p.month === newReleasePlan.month && p.year === newReleasePlan.year
      );
      
      if (existingPlans.length > 0) {
        // Find the highest version number
        const highestVersion = Math.max(...existingPlans.map((p: ReleasePlan) => p.version || 1));
        
        // Set the new version to be one higher than the highest existing version
        newReleasePlan.version = highestVersion + 1;
        
        logAdminAction('Creating new version of existing release plan', { 
          productId, 
          planId: newReleasePlan.id,
          oldVersion: highestVersion,
          newVersion: newReleasePlan.version
        });
        
        // Add the new version (don't replace)
        existingProduct.releasePlans.push(newReleasePlan);
      } else {
        logAdminAction('Adding new release plan', { 
          productId, 
          planId: newReleasePlan.id 
        });
        // Add new plans
        existingProduct.releasePlans.push(newReleasePlan);
      }
    }
    
    // Process metrics if provided
    if (updates.metrics && updates.metrics.length > 0) {
      logAdminAction('Processing metrics update', { 
        productId, 
        newMetricsCount: updates.metrics.length 
      });
      
      // Get month and year from the first metric
      const month = updates.metrics[0]?.month;
      const year = updates.metrics[0]?.year;
      
      if (month && year) {
        logAdminAction('Processing metrics for specific month/year', { 
          productId, 
          month, 
          year 
        });
        
        // Find existing metrics for the same month/year
        const existingMetrics = existingProduct.metrics.filter(
          (m: Metric) => m.month === month && m.year === year
        );
        
        if (existingMetrics.length > 0) {
          // Get the highest version
          const highestVersion = Math.max(...existingMetrics.map((m: Metric) => m.version || 1));
          
          logAdminAction('Creating new version of metrics', { 
            productId, 
            month, 
            year,
            existingMetricsCount: existingMetrics.length,
            highestVersion,
            newVersion: highestVersion + 1
          });
          
          // Set version for new metrics
          updates.metrics.forEach(metric => {
            metric.version = highestVersion + 1;
          });
        }
        
        // Add new metrics (don't replace existing ones)
        existingProduct.metrics.push(...updates.metrics);
        
        logAdminAction('Added new metrics', { 
          productId, 
          addedCount: updates.metrics.length,
          totalMetricsCount: existingProduct.metrics.length
        });
      }
    }
    
    // Process release notes if provided
    if (updates.releaseNotes && updates.releaseNotes.length > 0) {
      logAdminAction('Processing release notes update', { 
        productId, 
        newNotesCount: updates.releaseNotes.length 
      });
      
      // Get the first release note from the update
      const newReleaseNote = updates.releaseNotes[0];
      
      logAdminAction('Processing new release note', { 
        productId, 
        noteId: newReleaseNote.id,
        month: newReleaseNote.month,
        year: newReleaseNote.year,
        title: newReleaseNote.title
      });
      
      // Find existing notes for the same month/year
      const existingNotes = existingProduct.releaseNotes.filter(
        (n: ReleaseNote) => n.month === newReleaseNote.month && n.year === newReleaseNote.year
      );
      
      if (existingNotes.length > 0) {
        // Find the highest version number
        const highestVersion = Math.max(...existingNotes.map((n: ReleaseNote) => n.version || 1));
        
        // Set the new version to be one higher than the highest existing version
        newReleaseNote.version = highestVersion + 1;
        
        logAdminAction('Creating new version of existing release note', { 
          productId, 
          noteId: newReleaseNote.id,
          oldVersion: highestVersion,
          newVersion: newReleaseNote.version
        });
        
        // Add the new version (don't replace)
        existingProduct.releaseNotes.push(newReleaseNote);
      } else {
        logAdminAction('Adding new release note', { 
          productId, 
          noteId: newReleaseNote.id 
        });
        // Add new notes
        existingProduct.releaseNotes.push(newReleaseNote);
      }
    }
    
    // Process roadmap if provided
    if (updates.roadmap && updates.roadmap.length > 0) {
      logAdminAction('Processing roadmap update', { 
        productId, 
        newRoadmapCount: updates.roadmap.length 
      });
      
      // For each roadmap entry, check if there are existing entries for the same year
      for (const newRoadmap of updates.roadmap) {
        const existingRoadmaps = existingProduct.roadmap.filter(
          (r: Roadmap) => r.year === newRoadmap.year
        );
        
        if (existingRoadmaps.length > 0) {
          // Find the highest version number
          const highestVersion = Math.max(
            ...existingRoadmaps.map((r: Roadmap) => 
              typeof r.version === 'string' ? parseFloat(r.version) : (r.version || 1)
            )
          );
          
          // Set the new version to be one higher than the highest existing version
          const newVersion = (highestVersion + 1).toString();
          newRoadmap.version = newVersion;
          
          logAdminAction('Creating new version of existing roadmap', { 
            productId, 
            roadmapId: newRoadmap.id,
            year: newRoadmap.year,
            oldVersion: highestVersion,
            newVersion: newRoadmap.version
          });
        }
      }
      
      // Add new roadmap entries (don't replace existing ones)
      existingProduct.roadmap.push(...updates.roadmap);
      
      logAdminAction('Added new roadmaps', { 
        productId, 
        addedCount: updates.roadmap.length,
        totalRoadmapCount: existingProduct.roadmap.length
      });
    }
    
    // Process objectives if provided
    if (updates.objectives && updates.objectives.length > 0) {
      logAdminAction('Processing objectives update', { 
        productId, 
        newObjectivesCount: updates.objectives.length 
      });
      
      // Initialize objectives array if it doesn't exist
      if (!existingProduct.objectives) {
        existingProduct.objectives = [];
      }
      
      // Process each objective
      for (const newObjective of updates.objectives) {
        // Find existing objectives with the same title
        const existingObjectives = existingProduct.objectives.filter(
          (o: ProductObjective) => o.title === newObjective.title
        );
        
        if (existingObjectives.length > 0) {
          // Find the highest version number
          const highestVersion = Math.max(...existingObjectives.map((o: ProductObjective) => o.version || 1));
          
          // Set the new version to be one higher than the highest existing version
          newObjective.version = highestVersion + 1;
          
          logAdminAction('Creating new version of existing objective', { 
            productId, 
            objectiveId: newObjective.id,
            objectiveTitle: newObjective.title,
            oldVersion: highestVersion,
            newVersion: newObjective.version
          });
        } else {
          // Set version to 1 for new objectives
          newObjective.version = 1;
        }
        
        // Ensure createdAt is set
        if (!newObjective.createdAt) {
          newObjective.createdAt = new Date().toISOString();
        }
        
        // Add the new objective
        existingProduct.objectives.push(newObjective);
      }
      
      logAdminAction('Added new objectives', { 
        productId, 
        addedCount: updates.objectives.length,
        totalObjectivesCount: existingProduct.objectives.length
      });
    }
    
    // If no objectives in the product, load them from okrService
    if (!existingProduct.objectives || existingProduct.objectives.length === 0) {
      const productObjectives = getProductObjectives(productId);
      if (productObjectives.length > 0) {
        existingProduct.objectives = productObjectives;
        logAdminAction('Loaded objectives from okrService', { 
          productId, 
          objectivesCount: productObjectives.length
        });
      }
    }

    // Update the product in the portfolios array
    portfolios[portfolioIndex].products[productIndex] = existingProduct;

    // Save updated portfolios back to localStorage
    try {
      localStorage.setItem('portfolios', JSON.stringify(portfolios));
      logAdminAction('Successfully saved updated product to localStorage', { productId });
    } catch (saveError) {
      logAdminAction('Error saving to localStorage', { productId, error: saveError }, 'ERROR');
      throw new Error('Failed to save product changes to localStorage');
    }

    // Also update productPortalConfig format for compatibility
    try {
      const allProducts = portfolios.flatMap((p: any) => p.products);
      const productPortalConfig = {
        portfolios: portfolios,
        products: allProducts
      };
      localStorage.setItem('productPortalConfig', JSON.stringify(productPortalConfig));
      logAdminAction('Updated productPortalConfig format', { 
        productId, 
        totalProductsCount: allProducts.length 
      });
    } catch (configError) {
      logAdminAction('Error updating productPortalConfig', { productId, error: configError }, 'WARN');
    }

    // Save to XML file using xmlApiService
    try {
      logAdminAction('Starting XML file save via xmlApiService', { productId });
      const xmlSaved = await xmlApiService.saveProductXML(productId, existingProduct);
      if (xmlSaved.success) {
        logAdminAction('Successfully saved product to XML file via xmlApiService', { productId });
      } else {
        logAdminAction('Failed to save product to XML file via xmlApiService', { productId, error: xmlSaved.error }, 'WARN');
        // Log the failure but don't fail the entire operation
      }
    } catch (xmlError) {
      logAdminAction('Error saving to XML file via xmlApiService', { productId, error: xmlError }, 'ERROR');
      // Log the error but don't fail the entire operation
    }

    // Dispatch custom event to notify other components
    const updateEvent = new CustomEvent('productDataUpdated', { 
      detail: { productId, updatedProduct: existingProduct } 
    });
    window.dispatchEvent(updateEvent);
    logAdminAction('Dispatched productDataUpdated event', { productId });

    // Also trigger storage event for cross-tab communication
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'portfolios',
      newValue: JSON.stringify(portfolios),
      storageArea: localStorage
    }));

    logAdminAction('Save operation completed successfully', { 
      productId,
      finalCounts: {
        metrics: existingProduct.metrics?.length || 0,
        releaseGoals: existingProduct.releaseGoals?.length || 0,
        releasePlans: existingProduct.releasePlans?.length || 0,
        releaseNotes: existingProduct.releaseNotes?.length || 0,
        roadmap: existingProduct.roadmap?.length || 0,
        objectives: existingProduct.objectives?.length || 0
      }
    });

    return true;

  } catch (error) {
    logAdminAction('Save operation failed', { productId, error }, 'ERROR');
    return false;
  }
};

// Load product from remote storage
export const loadProductFromRemote = async (productId: string): Promise<Product | null> => {
  try {
    logAdminAction('Loading product from remote storage', { productId });
    
    const loadResult = await xmlApiService.loadProductXML(productId);
    
    if (loadResult.success && loadResult.data) {
      logAdminAction('Successfully loaded product from remote storage', { 
        productId, 
        productName: loadResult.data.name 
      });
      return loadResult.data;
    } else {
      logAdminAction('Failed to load from remote storage', { 
        productId, 
        error: loadResult.error 
      }, 'WARN');
      return null;
    }
  } catch (error) {
    logAdminAction('Error loading product from remote', { productId, error }, 'ERROR');
    return null;
  }
};

// Sync product data between local and remote storage
export const syncProductData = async (productId: string): Promise<boolean> => {
  try {
    logAdminAction('Syncing product data', { productId });
    
    // Try to load from remote first
    const remoteProduct = await loadProductFromRemote(productId);
    
    if (remoteProduct) {
      // Update localStorage with remote data
      const storedData = localStorage.getItem('productPortalConfig');
      if (storedData) {
        const allData = JSON.parse(storedData);
        const productIndex = allData.products?.findIndex((p: Product) => p.id === productId);
        
        if (productIndex !== -1) {
          allData.products[productIndex] = remoteProduct;
          localStorage.setItem('productPortalConfig', JSON.stringify(allData));
          
          // Dispatch update event
          window.dispatchEvent(new CustomEvent('productDataUpdated', {
            detail: { productId, updatedProduct: remoteProduct }
          }));
          
          logAdminAction('Successfully synced product data', { 
            productId, 
            productName: remoteProduct.name 
          });
          return true;
        }
      }
    }
    
    logAdminAction('Sync operation failed - no remote data found', { productId }, 'WARN');
    return false;
  } catch (error) {
    logAdminAction('Error syncing product data', { productId, error }, 'ERROR');
    return false;
  }
};

// Restore product from backup
export const restoreProductFromBackup = async (productId: string, backupKey: string): Promise<boolean> => {
  try {
    logAdminAction('Restoring product from backup', { productId, backupKey });
    
    const backupData = localStorage.getItem(backupKey);
    if (!backupData) {
      logAdminAction('Backup not found', { productId, backupKey }, 'ERROR');
      return false;
    }
    
    const productBackup = JSON.parse(backupData);
    
    // Get existing data from localStorage
    const storedData = localStorage.getItem('portfolios');
    if (!storedData) {
      logAdminAction('No portfolios data found in localStorage', { productId }, 'ERROR');
      return false;
    }
    
    const portfolios = JSON.parse(storedData);
    
    // Find the portfolio and product to update
    let productFound = false;
    let portfolioIndex = -1;
    let productIndex = -1;
    
    for (let i = 0; i < portfolios.length; i++) {
      const portfolio = portfolios[i];
      const pIndex = portfolio.products.findIndex((p: Product) => p.id === productId);
      
      if (pIndex !== -1) {
        portfolioIndex = i;
        productIndex = pIndex;
        productFound = true;
        break;
      }
    }
    
    if (!productFound) {
      logAdminAction('Product not found for restore', { productId }, 'ERROR');
      return false;
    }
    
    // Replace the product with the backup
    portfolios[portfolioIndex].products[productIndex] = productBackup;
    
    // Save updated portfolios back to localStorage
    localStorage.setItem('portfolios', JSON.stringify(portfolios));
    
    // Also update productPortalConfig format for compatibility
    const allProducts = portfolios.flatMap((p: any) => p.products);
    const productPortalConfig = {
      portfolios: portfolios,
      products: allProducts
    };
    localStorage.setItem('productPortalConfig', JSON.stringify(productPortalConfig));
    
    // Save to XML file using xmlApiService
    const xmlSaved = await xmlApiService.saveProductXML(productId, productBackup);
    if (!xmlSaved.success) {
      logAdminAction('Failed to save restored product to XML file via xmlApiService', { productId, error: xmlSaved.error }, 'ERROR');
      return false;
    }
    
    // Dispatch update event
    window.dispatchEvent(new CustomEvent('productDataUpdated', {
      detail: { productId, updatedProduct: productBackup }
    }));
    
    logAdminAction('Successfully restored product from backup', { 
      productId, 
      backupKey,
      productName: productBackup.name
    });
    return true;
    
  } catch (error) {
    logAdminAction('Error restoring product from backup', { productId, backupKey, error }, 'ERROR');
    return false;
  }
};

// List available backups for a product
export const listProductBackups = (productId: string): string[] => {
  try {
    const backupPrefix = `product_backup_${productId}_`;
    const keys = Object.keys(localStorage);
    const backups = keys.filter(key => key.startsWith(backupPrefix))
      .sort()
      .reverse(); // Most recent first
    
    logAdminAction('Listed product backups', { 
      productId, 
      backupCount: backups.length,
      backups: backups
    });
    
    return backups;
  } catch (error) {
    logAdminAction('Error listing product backups', { productId, error }, 'ERROR');
    return [];
  }
};
