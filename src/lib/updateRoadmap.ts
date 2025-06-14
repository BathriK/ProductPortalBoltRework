
import { Portfolio, Product, Roadmap } from './types';
import { getPortfolios, updatePortfolios } from "./data";

// XML Central roadmap data from the Google Sheet
const xmlCentralRoadmapData = {
  year: 2025,
  items: [
    {
      quarter: 1,
      title: "API Integration Framework",
      description: "Build unified API framework for external system integration",
      status: "completed"
    },
    {
      quarter: 1,
      title: "Performance Optimization",
      description: "Improve processing speed for large XML documents",
      status: "completed"
    },
    {
      quarter: 2,
      title: "Schema Validator 2.0",
      description: "Advanced validation with custom rule support",
      status: "in-progress"
    },
    {
      quarter: 2,
      title: "Custom Macros",
      description: "User-defined macros for repetitive operations",
      status: "planned"
    },
    {
      quarter: 3,
      title: "Batch Processing Engine",
      description: "Process multiple files with defined transformation rules",
      status: "planned"
    },
    {
      quarter: 3,
      title: "Advanced Search",
      description: "Full-text search across XML repositories",
      status: "planned"
    },
    {
      quarter: 4,
      title: "Collaboration Features",
      description: "Real-time collaborative editing and commenting",
      status: "planned"
    },
    {
      quarter: 4,
      title: "Document History",
      description: "Version control and change tracking",
      status: "planned"
    }
  ],
  link: "https://docs.google.com/spreadsheets/d/1FeX9iNB2a_4YwTbhKh3afvO0yGedhGn4L7Tfi1Rlzk0/edit?gid=115920112#gid=115920112"
};

// MliFlow roadmap data from the Google Sheet
const mliFlowRoadmapData = {
  year: 2025,
  items: [
    {
      quarter: 1,
      title: "MathML 4.0 Support",
      description: "Full support for the latest MathML specification",
      status: "completed"
    },
    {
      quarter: 1,
      title: "LaTeX Converter",
      description: "Convert between LaTeX and MathML formats",
      status: "completed"
    },
    {
      quarter: 2,
      title: "Equation Editor UI",
      description: "Visual equation editor with preview",
      status: "in-progress"
    },
    {
      quarter: 2,
      title: "MathJax Integration",
      description: "Client-side rendering engine integration",
      status: "in-progress"
    },
    {
      quarter: 3,
      title: "Formula Database",
      description: "Searchable database of common mathematical expressions",
      status: "planned"
    },
    {
      quarter: 3,
      title: "Accessibility Compliance",
      description: "Ensure math content is screen reader compatible",
      status: "planned"
    },
    {
      quarter: 4,
      title: "Symbol Recognition",
      description: "OCR for handwritten mathematical notation",
      status: "planned"
    },
    {
      quarter: 4,
      title: "Educational Tools",
      description: "Interactive elements for educational content",
      status: "planned"
    }
  ],
  link: "https://docs.google.com/spreadsheets/d/1FeX9iNB2a_4YwTbhKh3afvO0yGedhGn4L7Tfi1Rlzk0/edit?gid=115920112#gid=115920112"
};

// Function to generate a unique ID
const generateId = (): string => {
  return `roadmap-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

// Function to convert roadmap data to Roadmap objects (one per quarter)
const createRoadmapEntries = (productId: string, data: { year: number, items: { quarter: number, title: string, description: string, status: string }[], link?: string }): Roadmap[] => {
  return data.items.map(item => ({
    id: generateId(),
    year: data.year,
    quarter: item.quarter as 1 | 2 | 3 | 4,
    title: item.title,
    description: item.description,
    status: item.status as 'planned' | 'in-progress' | 'completed' | 'delayed',
    createdAt: new Date().toISOString(),
    version: "1",
    link: data.link || "https://docs.google.com/spreadsheets/d/1FeX9iNB2a_4YwTbhKh3afvO0yGedhGn4L7Tfi1Rlzk0/edit?gid=115920112#gid=115920112"
  }));
};

// Function to update product roadmaps
export const updateProductRoadmaps = async (): Promise<void> => {
  try {
    const portfolios = await getPortfolios();
    let updated = false;

    const updatedPortfolios = portfolios.map(portfolio => {
      const updatedProducts = portfolio.products.map(product => {
        if (product.id === "xml-central") {
          console.log("Updating XML Central roadmap");
          const roadmapEntries = createRoadmapEntries(product.id, xmlCentralRoadmapData);
          updated = true;
          return {
            ...product,
            roadmap: [...roadmapEntries, ...product.roadmap]
          };
        } else if (product.id === "mliflow") {
          console.log("Updating MliFlow roadmap");
          const roadmapEntries = createRoadmapEntries(product.id, mliFlowRoadmapData);
          updated = true;
          return {
            ...product,
            roadmap: [...roadmapEntries, ...product.roadmap]
          };
        }
        return product;
      });

      return {
        ...portfolio,
        products: updatedProducts
      };
    });

    if (updated) {
      await updatePortfolios(updatedPortfolios);
      console.log("Roadmaps updated successfully");
    } else {
      console.log("No products found to update");
    }
  } catch (error) {
    console.error("Error updating roadmaps:", error);
  }
};

// Updating for async handling
export async function updateRoadmap(productId: string, roadmapYear: number): Promise<boolean> {
  try {
    const portfolios = await getPortfolios();
    
    // Find the product and update its roadmap
    const updatedPortfolios = portfolios.map(portfolio => {
      const updatedProducts = portfolio.products.map(product => {
        if (product.id === productId) {
          // Create new roadmap entries with the Google Sheets link
          const now = new Date().toISOString();
          
          // Check if a roadmap for this year already exists
          const existingRoadmaps = product.roadmap.filter(r => r.year === roadmapYear);
          let newVersion = "1";
          
          if (existingRoadmaps.length > 0) {
            // Find the highest version number for this year
            const versions = existingRoadmaps.map(r => {
              const versionStr = r.version.toString();
              return parseInt(versionStr.split('.')[0]);
            });
            const highestVersion = Math.max(...versions);
            
            // Increment the version number by 1
            newVersion = (highestVersion + 1).toString();
          }
          
          const newRoadmapEntries = [1, 2, 3, 4].map(quarter => ({
            id: generateId(),
            year: roadmapYear,
            quarter: quarter as 1 | 2 | 3 | 4,
            title: `Q${quarter} Roadmap Item`,
            description: `Q${quarter} roadmap item from Google Sheets`,
            status: "planned" as const,
            createdAt: now,
            version: newVersion,
            link: "https://docs.google.com/spreadsheets/d/1FeX9iNB2a_4YwTbhKh3afvO0yGedhGn4L7Tfi1Rlzk0/edit?gid=115920112#gid=115920112"
          }));
          
          return {
            ...product,
            roadmap: [...newRoadmapEntries, ...product.roadmap]
          };
        }
        return product;
      });
      
      return {
        ...portfolio,
        products: updatedProducts
      };
    });
    
    // Update portfolios in storage
    await updatePortfolios(updatedPortfolios);
    return true;
  } catch (error) {
    console.error("Error updating roadmap:", error);
    return false;
  }
}

export const updateRoadmapItemStatus = async (
  productId: string,
  itemId: string,
  status: string
): Promise<{ success: boolean, error?: string }> => {
  try {
    const portfolios = await getPortfolios();
    
    const updatedPortfolios = portfolios.map(portfolio => {
      const updatedProducts = portfolio.products.map(product => {
        if (product.id === productId) {
          const updatedRoadmap = product.roadmap.map(roadmap => {
            if (roadmap.id === itemId) {
              return {
                ...roadmap,
                status: status as 'planned' | 'in-progress' | 'completed' | 'delayed'
              };
            }
            return roadmap;
          });
          return {
            ...product,
            roadmap: updatedRoadmap
          };
        }
        return product;
      });
      
      return {
        ...portfolio,
        products: updatedProducts
      };
    });
    
    await updatePortfolios(updatedPortfolios);
    return { success: true };
  } catch (error) {
    console.error('Error updating roadmap item status:', error);
    return { success: false, error: 'Failed to update roadmap item' };
  }
};

export const getProductRoadmap = async (productId: string): Promise<Roadmap[]> => {
  try {
    const portfolios = await getPortfolios();
    let roadmap: Roadmap[] = [];
    
    portfolios.forEach(portfolio => {
      portfolio.products.forEach(product => {
        if (product.id === productId) {
          roadmap = product.roadmap;
        }
      });
    });
    
    return roadmap;
  } catch (error) {
    console.error('Error getting product roadmap:', error);
    return [];
  }
};
