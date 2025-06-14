import { createClient } from '@supabase/supabase-js';

// Create a separate client for backend operations using service role key
const supabaseAdmin = createClient(
  "https://yxlwsqpcdeiimvcefmko.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHdzcXBjZGVpaW12Y2VmbWtvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODU5NjY2OSwiZXhwIjoyMDY0MTcyNjY5fQ.bKmZfG_GZNj3LJ_bIIY__Nrfb8oJHh5t_KPFrfZT0SM",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Backend service for database operations
export const backendDataService = {
  // Get all portfolios with admin privileges
  async getPortfolios() {
    try {
      console.log('backendDataService: Loading portfolios with service role...');
      
      const { data: portfoliosData, error: portfoliosError } = await supabaseAdmin
        .from('Portfolios')
        .select('*')
        .eq('Active', true);
      
      if (portfoliosError) {
        console.error('backendDataService: Error loading portfolios:', {
          error: portfoliosError,
          message: portfoliosError.message
        });
        throw new Error(`Failed to load portfolios: ${portfoliosError.message}`);
      }

      console.log('backendDataService: Found', portfoliosData?.length || 0, 'portfolios');
      return portfoliosData || [];
    } catch (error) {
      console.error('backendDataService: Error in getPortfolios:', error);
      throw error;
    }
  },

  // Get products for a portfolio
  async getProductsByPortfolio(portfolioId: string) {
    try {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('Products')
        .select('*')
        .eq('PortfolioID', portfolioId)
        .eq('Active', true);

      if (productsError) {
        console.error('backendDataService: Error loading products:', productsError);
        throw productsError;
      }

      return productsData || [];
    } catch (error) {
      console.error('backendDataService: Error in getProductsByPortfolio:', error);
      throw error;
    }
  },

  // Get all data for a specific product
  async getProductData(productId: string) {
    try {
      console.log('backendDataService: Loading product data for:', productId);

      // Load all related data with timeout and retry
      const timeout = 10000; // 10 second timeout
      const retryCount = 3;
      
      const loadDataWithRetry = async (query: any) => {
        for (let i = 0; i < retryCount; i++) {
          try {
            const { data, error } = await Promise.race([
              query,
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Request timeout')), timeout)
              )
            ]);
            
            if (error) throw error;
            return data || [];
          } catch (err) {
            if (i === retryCount - 1) throw err;
            console.log(`Attempt ${i + 1} failed, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
        return [];
      };

      // Load all data in parallel with retry
      const [
        metrics,
        goals,
        plans,
        notes,
        roadmap,
        roadmapDetails
      ] = await Promise.all([
        loadDataWithRetry(
          supabaseAdmin.from('Metrics').select('*').eq('ProductID', productId)
        ),
        loadDataWithRetry(
          supabaseAdmin.from('ReleaseGoals').select('*').eq('ProductID', productId)
        ),
        loadDataWithRetry(
          supabaseAdmin.from('ReleasePlan').select('*').eq('ProductID', productId)
        ),
        loadDataWithRetry(
          supabaseAdmin.from('ReleaseNotes').select('*').eq('ProductID', productId)
        ),
        loadDataWithRetry(
          supabaseAdmin.from('Roadmap').select('*').eq('ProductID', productId)
        ),
        loadDataWithRetry(
          supabaseAdmin.from('RoadmapDetail').select('*').eq('ProductID', productId)
        )
      ]);

      // Validate data structure
      const validateData = (data: any[], tableName: string) => {
        if (!Array.isArray(data)) {
          console.error(`Invalid data format for ${tableName}:`, data);
          return [];
        }
        return data.filter(item => 
          item && 
          typeof item === 'object' && 
          item.ProductID === productId
        );
      };

      return {
        metrics: validateData(metrics, 'Metrics'),
        goals: validateData(goals, 'ReleaseGoals'),
        plans: validateData(plans, 'ReleasePlan'),
        notes: validateData(notes, 'ReleaseNotes'),
        roadmap: validateData(roadmap, 'Roadmap'),
        roadmapDetails: validateData(roadmapDetails, 'RoadmapDetail')
      };
    } catch (error) {
      console.error('backendDataService: Error loading product data:', {
        error: error instanceof Error ? error.message : String(error),
        productId,
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  },

  // Save metrics data
  async saveMetrics(productId: string, metrics: any[], month: number, year: number) {
    try {
      // Delete existing metrics for this period
      await supabaseAdmin
        .from('Metrics')
        .delete()
        .eq('ProductID', productId)
        .eq('Month', month)
        .eq('Year', year);

      // Insert new metrics
      const metricsToInsert = metrics.map(metric => ({
        ProductID: productId,
        MetricName: metric.name,
        Value: metric.value,
        Unit: metric.unit,
        MonthlyTarget: metric.monthlyTarget,
        AnnualTarget: metric.annualTarget,
        Month: month,
        Year: year,
        Status: metric.status,
        notes: metric.notes,
        Description: metric.description,
        timestamp: metric.timestamp
      }));

      const { error } = await supabaseAdmin
        .from('Metrics')
        .insert(metricsToInsert);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('backendDataService: Error saving metrics:', error);
      throw error;
    }
  },

  // Save release goals
  async saveReleaseGoals(productId: string, goals: any[], month: number, year: number) {
    try {
      // Delete existing goals for this period
      await supabaseAdmin
        .from('ReleaseGoals')
        .delete()
        .eq('ProductID', productId)
        .eq('Month', month)
        .eq('Year', year);

      // Insert new goals
      const goalsToInsert = goals.map(goal => ({
        ProductID: productId,
        Month: month,
        Year: year,
        Goal: goal.description,
        CurrentState: goal.currentState,
        TargetState: goal.targetState,
        CreatedOn: new Date().toISOString().split('T')[0],
        Version: 1
      }));

      if (goalsToInsert.length > 0) {
        const { error } = await supabaseAdmin
          .from('ReleaseGoals')
          .insert(goalsToInsert);

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('backendDataService: Error saving release goals:', error);
      throw error;
    }
  },

  // Save release plans
  async saveReleasePlans(productId: string, plans: any[], month: number, year: number) {
    try {
      // Delete existing plans for this period
      await supabaseAdmin
        .from('ReleasePlan')
        .delete()
        .eq('ProductID', productId)
        .eq('Month', month)
        .eq('Year', year);

      // Insert new plans
      const plansToInsert = plans.map(plan => ({
        ProductID: productId,
        Month: month,
        Year: year,
        FeatureName: plan.title,
        Description: plan.description,
        Category: plan.category,
        Priority: plan.priority,
        Source: plan.source,
        owner: plan.owner,
        Status: plan.status,
        CreatedOn: new Date().toISOString().split('T')[0],
        Version: 1
      }));

      if (plansToInsert.length > 0) {
        const { error } = await supabaseAdmin
          .from('ReleasePlan')
          .insert(plansToInsert);

        if (error) throw error;
      }
      return true;
    } catch (error) {
      console.error('backendDataService: Error saving release plans:', error);
      throw error;
    }
  }
};

// Check if we're in a server environment (has process.env)
export const isServerEnvironment = typeof process !== 'undefined' && process.env;

// Export the admin client for direct use in server environments
export { supabaseAdmin };
