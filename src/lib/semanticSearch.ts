import { createEmbedding } from './embeddings';
import { Portfolio, Product, SearchResult } from './types';
import { generateId } from './utils';

// In-memory vector store for embeddings
interface VectorEntry {
  id: string;
  type: 'portfolio' | 'product' | 'goal' | 'plan' | 'note' | 'metric';
  text: string;
  embedding: number[];
  metadata: {
    portfolioId?: string;
    portfolioName?: string;
    productId?: string;
    productName?: string;
    field?: string;
    originalText?: string;
    month?: number;
    year?: number;
  };
}

let vectorStore: VectorEntry[] = [];
let isVectorStoreInitialized = false;

// Compute cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimensions');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Initialize the vector store with portfolio data
export async function initializeVectorStore(portfolios: Portfolio[]): Promise<void> {
  try {
    console.log("Initializing vector store with portfolios data...");
    
    // Clear existing store
    vectorStore = [];
    
    // Process portfolios
    for (const portfolio of portfolios) {
      // Add portfolio name
      const portfolioText = `Portfolio: ${portfolio.name}`;
      const portfolioEmbedding = await createEmbedding(portfolioText);
      
      vectorStore.push({
        id: `portfolio-${portfolio.id}`,
        type: 'portfolio',
        text: portfolioText,
        embedding: portfolioEmbedding,
        metadata: {
          portfolioId: portfolio.id,
          portfolioName: portfolio.name,
          field: 'name',
          originalText: portfolio.name
        }
      });
      
      // Process products
      for (const product of portfolio.products) {
        // Add product name
        const productNameText = `Product: ${product.name}`;
        const productNameEmbedding = await createEmbedding(productNameText);
        
        vectorStore.push({
          id: `product-${product.id}-name`,
          type: 'product',
          text: productNameText,
          embedding: productNameEmbedding,
          metadata: {
            portfolioId: portfolio.id,
            portfolioName: portfolio.name,
            productId: product.id,
            productName: product.name,
            field: 'name',
            originalText: product.name
          }
        });
        
        // Add product description
        if (product.description) {
          const productDescText = `Product description: ${product.description}`;
          const productDescEmbedding = await createEmbedding(productDescText);
          
          vectorStore.push({
            id: `product-${product.id}-description`,
            type: 'product',
            text: productDescText,
            embedding: productDescEmbedding,
            metadata: {
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              productId: product.id,
              productName: product.name,
              field: 'description',
              originalText: product.description
            }
          });
        }
        
        // Add release goals
        for (const goal of product.releaseGoals) {
          // Add individual goal items
          if (goal.goals && goal.goals.length > 0) {
            for (const item of goal.goals) {
              const goalText = `Goal for ${product.name} (${goal.month}/${goal.year}): ${item.description}. Current state: ${item.currentState}. Target state: ${item.targetState}`;
              const goalEmbedding = await createEmbedding(goalText);
              
              vectorStore.push({
                id: `goal-${item.id}`,
                type: 'goal',
                text: goalText,
                embedding: goalEmbedding,
                metadata: {
                  portfolioId: portfolio.id,
                  portfolioName: portfolio.name,
                  productId: product.id,
                  productName: product.name,
                  field: 'goals',
                  originalText: item.description,
                  month: goal.month,
                  year: goal.year
                }
              });
            }
          } 
          // Handle legacy format
          else if (goal.goal) {
            const goalText = `Goal for ${product.name} (${goal.month}/${goal.year}): ${goal.goal}. Current state: ${goal.currentState || ''}. Future state: ${goal.futureState || ''}`;
            const goalEmbedding = await createEmbedding(goalText);
            
            vectorStore.push({
              id: `goal-${goal.id}`,
              type: 'goal',
              text: goalText,
              embedding: goalEmbedding,
              metadata: {
                portfolioId: portfolio.id,
                portfolioName: portfolio.name,
                productId: product.id,
                productName: product.name,
                field: 'goal',
                originalText: goal.goal,
                month: goal.month,
                year: goal.year
              }
            });
          }
        }
        
        // Add release plans
        for (const plan of product.releasePlans) {
          if (plan.items && plan.items.length > 0) {
            for (const item of plan.items) {
              const planOwner = item.owner ? `Owner: ${item.owner}` : '';
              const planText = `Plan for ${product.name} (${plan.month}/${plan.year}): ${item.title}. ${item.description}. Status: ${item.status}. ${planOwner}`;
              const planEmbedding = await createEmbedding(planText);
              
              vectorStore.push({
                id: `plan-${item.id}`,
                type: 'plan',
                text: planText,
                embedding: planEmbedding,
                metadata: {
                  portfolioId: portfolio.id,
                  portfolioName: portfolio.name,
                  productId: product.id,
                  productName: product.name,
                  field: 'plan',
                  originalText: item.title,
                  month: plan.month,
                  year: plan.year
                }
              });
            }
          }
        }
        
        // Add metrics (might be useful for questions about performance)
        for (const metric of product.metrics) {
          const metricText = `Metric for ${product.name} (${metric.month}/${metric.year}): ${metric.name} = ${metric.value} ${metric.unit}. ${metric.description || ''}`;
          const metricEmbedding = await createEmbedding(metricText);
          
          vectorStore.push({
            id: `metric-${metric.id}`,
            type: 'metric',
            text: metricText,
            embedding: metricEmbedding,
            metadata: {
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              productId: product.id,
              productName: product.name,
              field: 'metric',
              originalText: metric.name,
              month: metric.month,
              year: metric.year
            }
          });
        }
      }
    }
    
    console.log(`Vector store initialized with ${vectorStore.length} entries.`);
    isVectorStoreInitialized = true;
    
  } catch (error) {
    console.error("Failed to initialize vector store:", error);
    throw error;
  }
}

// Check if vector store is initialized
export function isInitialized(): boolean {
  return isVectorStoreInitialized;
}

// Perform semantic search
export async function semanticSearch(query: string, topK: number = 5): Promise<SearchResult[]> {
  try {
    if (vectorStore.length === 0) {
      console.warn("Vector store is empty. Initialize it first.");
      return [];
    }
    
    // Create embedding for the query
    const queryEmbedding = await createEmbedding(query);
    
    // Check for specific time-based queries
    const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
    const monthRegex = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'i');
    const monthMatch = query.match(monthRegex);
    
    const yearRegex = /\b(202[0-9])\b/;
    const yearMatch = query.match(yearRegex);
    
    // Check for "without" or "missing" or "no" patterns
    const withoutPattern = /\b(without|missing|no|lack|lacking|don't have)\b/i;
    const withoutMatch = query.match(withoutPattern);
    
    // Check for specific data types
    const metricPattern = /\b(metric|metrics|kpi|kpis|performance)\b/i;
    const metricMatch = query.match(metricPattern);
    
    const goalPattern = /\b(goal|goals|objective|objectives)\b/i;
    const goalMatch = query.match(goalPattern);
    
    const planPattern = /\b(plan|plans|roadmap|roadmaps)\b/i;
    const planMatch = query.match(planPattern);
    
    // Calculate similarities with all vectors
    let results = vectorStore.map(entry => {
      const similarity = cosineSimilarity(queryEmbedding, entry.embedding);
      return {
        ...entry,
        similarity
      };
    });
    
    // Apply filters based on query patterns
    if (monthMatch || yearMatch || withoutMatch || metricMatch || goalMatch || planMatch) {
      // Get month number if month name is mentioned
      let targetMonth: number | undefined;
      if (monthMatch) {
        const monthName = monthMatch[0].toLowerCase();
        targetMonth = monthNames.findIndex(m => m.toLowerCase() === monthName) + 1;
      }
      
      // Get year if mentioned
      let targetYear: number | undefined;
      if (yearMatch) {
        targetYear = parseInt(yearMatch[0]);
      }
      
      // Filter by data type if specified
      if (metricMatch) {
        results = results.filter(r => r.type === 'metric');
      } else if (goalMatch) {
        results = results.filter(r => r.type === 'goal');
      } else if (planMatch) {
        results = results.filter(r => r.type === 'plan');
      }
      
      // Filter by time period if specified
      if (targetMonth || targetYear) {
        results = results.filter(r => {
          if (!r.metadata.month || !r.metadata.year) return true;
          
          if (targetMonth && targetYear) {
            return r.metadata.month === targetMonth && r.metadata.year === targetYear;
          } else if (targetMonth) {
            return r.metadata.month === targetMonth;
          } else if (targetYear) {
            return r.metadata.year === targetYear;
          }
          
          return true;
        });
      }
      
      // Handle "without" queries specially
      if (withoutMatch) {
        // Get all product IDs
        const allProductIds = [...new Set(vectorStore.map(entry => entry.metadata.productId).filter(Boolean))];
        
        // Find products that match the criteria
        let matchingProductIds: string[] = [];
        
        if (metricMatch && (targetMonth || targetYear)) {
          // Find all products with metrics for the specified period
          const productsWithMetrics = [...new Set(
            results
              .filter(r => r.type === 'metric')
              .filter(r => {
                if (targetMonth && targetYear) {
                  return r.metadata.month === targetMonth && r.metadata.year === targetYear;
                } else if (targetMonth) {
                  return r.metadata.month === targetMonth;
                } else if (targetYear) {
                  return r.metadata.year === targetYear;
                }
                return true;
              })
              .map(r => r.metadata.productId)
              .filter(Boolean) as string[]
          )];
          
          // Products without metrics are those not in the list
          matchingProductIds = allProductIds.filter(id => !productsWithMetrics.includes(id));
        } else if (goalMatch && (targetMonth || targetYear)) {
          // Similar logic for goals
          const productsWithGoals = [...new Set(
            results
              .filter(r => r.type === 'goal')
              .filter(r => {
                if (targetMonth && targetYear) {
                  return r.metadata.month === targetMonth && r.metadata.year === targetYear;
                } else if (targetMonth) {
                  return r.metadata.month === targetMonth;
                } else if (targetYear) {
                  return r.metadata.year === targetYear;
                }
                return true;
              })
              .map(r => r.metadata.productId)
              .filter(Boolean) as string[]
          )];
          
          matchingProductIds = allProductIds.filter(id => !productsWithGoals.includes(id));
        } else if (planMatch && (targetMonth || targetYear)) {
          // Similar logic for plans
          const productsWithPlans = [...new Set(
            results
              .filter(r => r.type === 'plan')
              .filter(r => {
                if (targetMonth && targetYear) {
                  return r.metadata.month === targetMonth && r.metadata.year === targetYear;
                } else if (targetMonth) {
                  return r.metadata.month === targetMonth;
                } else if (targetYear) {
                  return r.metadata.year === targetYear;
                }
                return true;
              })
              .map(r => r.metadata.productId)
              .filter(Boolean) as string[]
          )];
          
          matchingProductIds = allProductIds.filter(id => !productsWithPlans.includes(id));
        }
        
        // Create synthetic results for products without the specified data
        if (matchingProductIds.length > 0) {
          const syntheticResults: SearchResult[] = matchingProductIds.map(productId => {
            const productEntry = vectorStore.find(e => e.metadata.productId === productId);
            if (!productEntry) return null;
            
            return {
              type: 'product',
              id: productId,
              name: productEntry.metadata.productName || 'Unknown Product',
              portfolioId: productEntry.metadata.portfolioId,
              portfolioName: productEntry.metadata.portfolioName,
              matchField: metricMatch ? 'Missing Metrics' : goalMatch ? 'Missing Goals' : planMatch ? 'Missing Plans' : 'Missing Data',
              matchValue: targetMonth && targetYear 
                ? `No data for ${monthNames[targetMonth-1]} ${targetYear}` 
                : targetMonth 
                  ? `No data for ${monthNames[targetMonth-1]}` 
                  : targetYear 
                    ? `No data for ${targetYear}` 
                    : 'No data for specified period',
              semanticScore: 1.0,
              semanticText: `This product does not have ${metricMatch ? 'metrics' : goalMatch ? 'goals' : planMatch ? 'plans' : 'data'} for the specified period.`
            };
          }).filter(Boolean) as SearchResult[];
          
          return syntheticResults;
        }
      }
    }
    
    // Sort by similarity (descending)
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Take top K results
    const topResults = results.slice(0, topK);
    
    // Convert to SearchResult format
    const searchResults: SearchResult[] = topResults.map(result => {
      // Extract relevant information based on the entry type
      let matchField = result.metadata.field || 'semantic';
      let matchValue = result.metadata.originalText || '';
      
      // Enhanced descriptions for different entry types
      if (result.type === 'goal') {
        matchField = 'Goal';
      } else if (result.type === 'plan') {
        matchField = 'Plan';
      } else if (result.type === 'note') {
        matchField = 'Note';
      } else if (result.type === 'metric') {
        matchField = 'Metric';
      }
      
      return {
        type: (result.type === 'portfolio') ? 'portfolio' : 'product',
        id: (result.type === 'portfolio') ? result.metadata.portfolioId! : result.metadata.productId!,
        name: (result.type === 'portfolio') ? result.metadata.portfolioName! : result.metadata.productName!,
        portfolioId: result.metadata.portfolioId,
        portfolioName: result.metadata.portfolioName,
        matchField,
        matchValue,
        semanticScore: result.similarity,
        semanticText: result.text
      };
    });
    
    return searchResults;
    
  } catch (error) {
    console.error("Semantic search failed:", error);
    return [];
  }
}