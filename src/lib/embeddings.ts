import OpenAI from 'openai';

// In a production environment, this would be securely stored
// For this demo, we'll use a simple approach
let OPENAI_API_KEY = '';

// Simple in-memory cache for embeddings to avoid redundant API calls
const embeddingCache: Record<string, number[]> = {};

// Mock embedding function for development/testing without API key
function createMockEmbedding(text: string): number[] {
  // Create a deterministic but simplistic embedding based on the text
  // This is NOT suitable for production, just for demonstration
  const mockDimension = 384; // Similar to text-embedding-3-small dimension
  const embedding = new Array(mockDimension).fill(0);
  
  // Generate some values based on character codes
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const position = charCode % mockDimension;
    embedding[position] = (embedding[position] + charCode / 1000) % 1;
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

// Initialize OpenAI client (if API key is available)
let openaiClient: OpenAI | null = null;

export function setOpenAIKey(apiKey: string): void {
  OPENAI_API_KEY = apiKey;
  if (apiKey) {
    openaiClient = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
    console.log("OpenAI client initialized");
  } else {
    openaiClient = null;
    console.log("OpenAI client disabled, using mock embeddings");
  }
}

// Create text embedding using OpenAI API (or mock if no API key)
export async function createEmbedding(text: string): Promise<number[]> {
  // Check if we have a cached embedding for this exact text
  if (embeddingCache[text]) {
    return embeddingCache[text];
  }
  
  try {
    let embedding: number[];
    
    // If we have a valid OpenAI client, use the API
    if (openaiClient) {
      const response = await openaiClient.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
        encoding_format: "float"
      });
      
      embedding = response.data[0].embedding;
    } else {
      // Otherwise use the mock function
      embedding = createMockEmbedding(text);
    }
    
    // Cache the result
    embeddingCache[text] = embedding;
    return embedding;
    
  } catch (error) {
    console.error("Error creating embedding:", error);
    // Fallback to mock embedding on error
    const mockEmbedding = createMockEmbedding(text);
    embeddingCache[text] = mockEmbedding;
    return mockEmbedding;
  }
}