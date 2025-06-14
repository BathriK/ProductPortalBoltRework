import { createClient } from '@supabase/supabase-js';
import { createEdgeFunctionHandler } from 'supabase-edge-middleware';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default createEdgeFunctionHandler(async (req, ctx) => {
  try {
    const { productId } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product ID is required' }),
        { status: 400 }
      );
    }

    // Load all product-related data in parallel
    const [
      { data: metricsData },
      { data: goalsData },
      { data: plansData },
      { data: notesData },
      { data: roadmapData },
      { data: roadmapDetailsData }
    ] = await Promise.all([
      supabaseAdmin.from('Metrics').select('*').eq('ProductID', productId),
      supabaseAdmin.from('ReleaseGoals').select('*').eq('ProductID', productId),
      supabaseAdmin.from('ReleasePlan').select('*').eq('ProductID', productId),
      supabaseAdmin.from('ReleaseNotes').select('*').eq('ProductID', productId),
      supabaseAdmin.from('Roadmap').select('*').eq('ProductID', productId),
      supabaseAdmin.from('RoadmapDetail').select('*').eq('ProductID', productId)
    ]);

    // Load product details
    const { data: productData, error: productError } = await supabaseAdmin
      .from('Products')
      .select('*')
      .eq('ID', productId)
      .single();

    if (productError) {
      return new Response(
        JSON.stringify({ success: false, error: productError.message }),
        { status: 500 }
      );
    }

    // Load portfolio details
    const { data: portfolioData, error: portfolioError } = await supabaseAdmin
      .from('Portfolios')
      .select('*')
      .eq('PortfolioID', productData.PortfolioID)
      .single();

    if (portfolioError) {
      console.error('Error loading portfolio:', portfolioError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ProductName: productData.ProductName,
          Description: productData.Description,
          PortfolioID: productData.PortfolioID,
          PortfolioName: portfolioData?.PortfolioName,
          metrics: metricsData || [],
          goals: goalsData || [],
          plans: plansData || [],
          notes: notesData || [],
          roadmap: roadmapData || [],
          roadmapDetails: roadmapDetailsData || []
        }
      })
    );

  } catch (error) {
    console.error('Error in getProductData:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500 }
    );
  }
});
