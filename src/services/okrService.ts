import type { ProductObjective } from '../lib/types';
import { adminLogger } from '../lib/adminLogger';

const OKR_STORAGE_KEY = 'productObjectives';

// Enhanced logging function for admin logs
function logAdminAction(action: string, details: any, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  adminLogger(`OKRService: ${action}`, details, level);
}

export const saveProductObjectives = (objectives: ProductObjective[]): boolean => {
  try {
    const dataToSave = JSON.stringify(objectives, null, 2);
    localStorage.setItem(OKR_STORAGE_KEY, dataToSave);
    logAdminAction('OKR objectives saved successfully', { objectivesCount: objectives.length });
    
    // Dispatch a custom event to notify other components of the update
    const updateEvent = new CustomEvent('okrDataUpdated', {
      detail: { objectives }
    });
    window.dispatchEvent(updateEvent);
    
    return true;
  } catch (error) {
    logAdminAction('Error saving OKR objectives', { error }, 'ERROR');
    return false;
  }
};

export const loadProductObjectives = (): ProductObjective[] => {
  try {
    const stored = localStorage.getItem(OKR_STORAGE_KEY);
    if (stored) {
      const objectives = JSON.parse(stored);
      logAdminAction('Loaded OKR objectives from localStorage', { objectivesCount: objectives.length });
      return objectives;
    }
    
    // Return sample data if nothing stored
    logAdminAction('No stored objectives found, returning sample data', {});
    return getSampleObjectives();
  } catch (error) {
    logAdminAction('Error loading OKR objectives', { error }, 'ERROR');
    return getSampleObjectives();
  }
};

export const updateObjective = (objectives: ProductObjective[], updatedObjective: ProductObjective): ProductObjective[] => {
  logAdminAction('Updating objective', { 
    objectiveId: updatedObjective.id, 
    objectiveTitle: updatedObjective.title 
  });
  
  // Find existing objectives for the same product
  const existingObjectives = objectives.filter(obj => 
    obj.productId === updatedObjective.productId && 
    obj.title === updatedObjective.title
  );
  
  // Increment version if there are existing objectives
  if (existingObjectives.length > 0) {
    // Find the highest version number
    const highestVersion = Math.max(...existingObjectives.map(obj => obj.version || 1));
    
    // Set the new version to be one higher than the highest existing version
    updatedObjective.version = highestVersion + 1;
    
    logAdminAction('Creating new version of existing objective', { 
      objectiveId: updatedObjective.id,
      oldVersion: highestVersion,
      newVersion: updatedObjective.version
    });
  } else {
    // Set version to 1 for new objectives
    updatedObjective.version = 1;
  }
  
  // Set creation timestamp if not already set
  if (!updatedObjective.createdAt) {
    updatedObjective.createdAt = new Date().toISOString();
  }
  
  // Replace the old objective with the updated one
  const updatedObjectives = objectives.map(obj => 
    obj.id === updatedObjective.id ? updatedObjective : obj
  );
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    logAdminAction('Objective updated and saved successfully', {});
  } else {
    logAdminAction('Failed to save updated objective', {}, 'ERROR');
  }
  
  return updatedObjectives;
};

export const deleteObjective = (objectives: ProductObjective[], objectiveId: string): ProductObjective[] => {
  logAdminAction('Deleting objective', { objectiveId });
  const updatedObjectives = objectives.filter(obj => obj.id !== objectiveId);
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    logAdminAction('Objective deleted and saved successfully', {});
  } else {
    logAdminAction('Failed to save after deleting objective', {}, 'ERROR');
  }
  
  return updatedObjectives;
};

export const addObjective = (objectives: ProductObjective[], newObjective: ProductObjective): ProductObjective[] => {
  logAdminAction('Adding new objective', { 
    objectiveTitle: newObjective.title,
    productId: newObjective.productId
  });
  
  // Set version to 1 for new objectives
  newObjective.version = 1;
  
  // Set creation timestamp
  newObjective.createdAt = new Date().toISOString();
  
  const updatedObjectives = [...objectives, newObjective];
  
  const saved = saveProductObjectives(updatedObjectives);
  if (saved) {
    logAdminAction('New objective added and saved successfully', {});
  } else {
    logAdminAction('Failed to save new objective', {}, 'ERROR');
  }
  
  return updatedObjectives;
};

// Get objectives for a specific product
export const getProductObjectives = (productId: string): ProductObjective[] => {
  const allObjectives = loadProductObjectives();
  return allObjectives.filter(obj => obj.productId === productId);
};

// Get the latest version of objectives for a product
export const getLatestProductObjectives = (productId: string): ProductObjective[] => {
  const productObjectives = getProductObjectives(productId);
  
  // Group objectives by title (assuming title is unique for a product)
  const objectivesByTitle = productObjectives.reduce((groups, obj) => {
    if (!groups[obj.title]) {
      groups[obj.title] = [];
    }
    groups[obj.title].push(obj);
    return groups;
  }, {} as Record<string, ProductObjective[]>);
  
  // Get the latest version of each objective
  return Object.values(objectivesByTitle).map(group => {
    return group.reduce((latest, current) => {
      return (current.version > latest.version) ? current : latest;
    });
  });
};

// Check if a product has OKRs
export const hasProductObjectives = (productId: string): boolean => {
  const objectives = getProductObjectives(productId);
  return objectives.length > 0;
};

const getSampleObjectives = (): ProductObjective[] => [
  {
    id: '1',
    title: 'Make structuring more efficient - TAT, TT and FTR',
    description: 'Improve processing efficiency across all key metrics',
    productId: 'xml-central',
    priority: 1,
    status: 'In Progress',
    createdAt: new Date().toISOString(),
    version: 1,
    initiatives: [
      {
        id: '1-1',
        title: 'Rollout to all FTV accounts',
        description: 'Deploy to all FTV customer accounts with systematic approach',
        targetDate: 'Mar 2026',
        status: 'In Progress',
        progress: 65
      },
      {
        id: '1-2', 
        title: 'Efficiency gains',
        description: 'Optimize processing workflows and reduce manual intervention',
        targetDate: 'Dec 2025',
        status: 'In Progress',
        progress: 40
      },
      {
        id: '1-3',
        title: 'Adoption rate',
        description: 'Increase customer adoption of new features',
        targetDate: 'Jun 2025',
        status: 'Not Started',
        progress: 0
      }
    ],
    expectedBenefits: [
      {
        id: '1-b1',
        title: 'LeMans Deployment',
        description: 'Starting with LeMans (01) deployment and stabilization to be completed for all FTV customers by March 2026',
        targetValue: 'March 2026',
        metricType: 'Timeline',
        status: 'In Progress'
      },
      {
        id: '1-b2',
        title: 'TT Benefit',
        description: 'Achieve a minimum TT benefit of 10% upon deployment (baseline: Dec 2024)',
        targetValue: '10% improvement',
        metricType: 'Performance',
        status: 'In Progress'
      },
      {
        id: '1-b3',
        title: 'FTR for FTV accounts',
        description: 'Achieve the 90% FuB FTR for FTV all accounts (baseline: Dec 2024)',
        targetValue: '90% FTR',
        metricType: 'Quality',
        status: 'Not Started'
      },
      {
        id: '1-b4',
        title: 'DOCX Processing',
        description: 'A minimum of 80% (100+60) of DOCX submissions processed via XML',
        targetValue: '80% processing rate',
        metricType: 'Coverage',
        status: 'Not Started'
      }
    ]
  },
  {
    id: '2',
    title: 'Make content distribution and searchability better',
    description: 'Enhance content delivery and discoverability capabilities',
    productId: 'mliflow',
    priority: 2,
    status: 'Not Started',
    createdAt: new Date().toISOString(),
    version: 1,
    initiatives: [
      {
        id: '2-1',
        title: 'Content indexing optimization',
        description: 'Improve search algorithms and content categorization',
        targetDate: 'Sep 2025',
        status: 'Not Started',
        progress: 0
      }
    ],
    expectedBenefits: [
      {
        id: '2-b1',
        title: 'Search Performance',
        description: 'Improve content discovery rates by 50%',
        targetValue: '50% improvement',
        metricType: 'Performance',
        status: 'Not Started'
      }
    ]
  }
];