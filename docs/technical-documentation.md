# TNQ Product Portal - Technical Documentation

## System Architecture

The TNQ Product Portal is a React-based web application designed to manage and display product information, metrics, roadmaps, release goals, and plans. The application follows a client-side architecture with data persistence handled through a combination of XML files and browser localStorage.

### Key Components

1. **Data Storage**
   - Primary data source: XML files stored in `/public/data/`
   - In-memory cache: Browser localStorage
   - Data versioning: Each data type (metrics, goals, plans) supports versioning

2. **Frontend Framework**
   - React 18.3.1 with TypeScript
   - Vite for build and development
   - TailwindCSS for styling
   - shadcn/ui component library

3. **State Management**
   - React Context API for global state
   - Custom hooks for data fetching and manipulation

4. **Search Capabilities**
   - Basic keyword search
   - AI-powered semantic search using OpenAI embeddings

## Data Flow Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│   XML Files     │────▶│   LocalStorage  │────▶│   React State   │
│  (Data Source)  │     │    (Cache)      │     │  (UI Display)   │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                       ▲                       │
        │                       │                       │
        └───────────────────────┴───────────────────────┘
                            Data Updates
```

### Data Loading Process

1. Application loads portfolio structure from `/public/data/PortfolioProduct.xml`
2. Individual product data is loaded from product-specific XML files
3. Data is cached in localStorage for faster access
4. React components consume data from localStorage via context providers

### Data Saving Process

1. User edits data in the UI
2. Changes are saved to localStorage
3. Custom events notify components of data changes
4. Changes can be exported as XML for persistence

## Core Data Types

The application manages several key data types:

1. **Portfolios**: Collections of related products
2. **Products**: Individual products with associated data
3. **Metrics**: Performance indicators for products
4. **Roadmaps**: Future development plans organized by quarter
5. **Release Goals**: Specific objectives for product releases
6. **Release Plans**: Detailed implementation plans for releases
7. **Release Notes**: Documentation of completed releases

## File Structure

```
src/
├── components/         # UI components
│   ├── ui/             # shadcn/ui components
│   ├── EditSections/   # Product editing components
│   └── ...
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility functions and core logic
├── pages/              # Page components
├── services/           # Service layer for data operations
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Key Services

### Data Service (`lib/data.ts`)

Responsible for loading and parsing XML data, managing the cache, and providing data to the application.

```typescript
// Key functions
export async function getPortfolios(): Promise<Portfolio[]>
export async function findProductById(productId: string): Promise<{ product: Product | null; portfolio: Portfolio | null }>
export function updatePortfolios(portfolios: Portfolio[]): void
export function clearPortfolioCache(): void
```

### Product Edit Service (`services/productEditService.ts`)

Handles saving changes to products, including metrics, goals, plans, and notes.

```typescript
// Key functions
export const saveProductChanges = async (
  productId: string,
  updates: {
    metrics?: Metric[];
    releaseGoals?: ReleaseGoal[];
    releasePlans?: ReleasePlan[];
    releaseNotes?: ReleaseNote[];
    roadmap?: Roadmap[];
  }
): Promise<boolean>
```

### XML API Service (`services/xmlApiService.ts`)

Manages XML file operations, including loading, saving, and publishing XML data.

```typescript
// Key functions
async saveProductXML(productId: string, product: Product): Promise<XMLOperationResult>
async loadProductXML(productId: string): Promise<XMLOperationResult>
async publishPortfolioXMLs(portfolios: Portfolio[]): Promise<XMLOperationResult>
```

### Storage Service (`services/storageService.ts`)

Provides an abstraction layer for storage operations, supporting both local storage and Supabase cloud storage.

```typescript
// Key functions
async save(path: string, content: string): Promise<boolean>
async load(path: string): Promise<string | null>
async list(prefix?: string): Promise<string[]>
async delete(path: string): Promise<boolean>
```

## Semantic Search Implementation

The application includes an AI-powered semantic search feature:

1. **Vector Store**: In-memory storage for text embeddings
2. **Embedding Generation**: Using OpenAI's text-embedding-3-small model
3. **Similarity Search**: Cosine similarity between query and stored embeddings
4. **Fallback Mechanism**: Basic keyword search when AI search is unavailable

```typescript
// Key functions in lib/semanticSearch.ts
export async function initializeVectorStore(portfolios: Portfolio[]): Promise<void>
export async function semanticSearch(query: string, topK: number = 5): Promise<SearchResult[]>
```

## Authentication and Authorization

The application implements a simple role-based access control system:

1. **User Roles**:
   - `admin`: Full access to all features
   - `product_manager`: Can edit assigned products
   - `stakeholder`: Read-only access

2. **Authentication Flow**:
   - Login with email/password
   - JWT token stored in localStorage
   - Protected routes using React Router

## Version Control System

Each data type supports versioning:

1. **Version Creation**: New versions are created when data is saved
2. **Version Display**: UI components show version badges
3. **Version Comparison**: Users can compare different versions of the same data

## Data Import/Export

The application supports:

1. **XML Export**: Export product data as XML files
2. **XML Import**: Import product data from XML files
3. **Data Paste**: Paste tabular data from spreadsheets

## Performance Considerations

1. **Caching**: Data is cached in localStorage to reduce XML parsing overhead
2. **Lazy Loading**: Components load data on demand
3. **Memoization**: React's useMemo and useCallback for expensive operations
4. **Embedding Cache**: Semantic search embeddings are cached to reduce API calls

## Error Handling

1. **Graceful Degradation**: Fallbacks for missing or corrupted data
2. **Error Boundaries**: React error boundaries to prevent UI crashes
3. **Logging**: Comprehensive console logging for debugging

## Future Enhancements

1. **Server-Side Storage**: Move from client-side to server-side storage
2. **Real-time Collaboration**: Add WebSocket support for multi-user editing
3. **Advanced Analytics**: Implement data visualization for metrics
4. **Automated Testing**: Add comprehensive test coverage
5. **Mobile Optimization**: Enhance mobile responsiveness

## Deployment

The application can be deployed as a static site to any hosting provider that supports static websites, such as:

1. Netlify
2. Vercel
3. GitHub Pages
4. AWS S3 + CloudFront

## Integration Points

The application can integrate with:

1. **Supabase**: For cloud storage and authentication
2. **OpenAI**: For semantic search capabilities
3. **Google Sheets**: For roadmap links and external data