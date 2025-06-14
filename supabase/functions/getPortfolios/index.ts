import { createClient } from '@supabase/supabase-js';
import { createEdgeFunctionHandler } from 'supabase-edge-middleware';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default createEdgeFunctionHandler(async (req, ctx) => {
  try {
    // Load active portfolios
    const { data: portfoliosData, error: portfoliosError } = await supabaseAdmin
      .from('Portfolios')
      .select('*')
      .eq('Active', true);

    if (portfoliosError) {
      return new Response(
        JSON.stringify({ success: false, error: portfoliosError.message }),
        { status: 500 }
      );
    }

    // Load products for each portfolio
    const portfoliosWithProducts: any[] = [];
    
    for (const portfolio of portfoliosData) {
      const { data: productsData, error: productsError } = await supabaseAdmin
        .from('Products')
        .select('*')
        .eq('PortfolioID', portfolio.PortfolioID)
        .eq('Active', true);

      if (productsError) {
        console.error('Error loading products for portfolio:', productsError);
        continue;
      }

      portfoliosWithProducts.push({
        PortfolioID: portfolio.PortfolioID,
        PortfolioName: portfolio.PortfolioName,
        Description: portfolio.Description,
        products: productsData || []
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: portfoliosWithProducts
      })
    );

  } catch (error) {
    console.error('Error in getPortfolios:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500 }
    );
  }
});
