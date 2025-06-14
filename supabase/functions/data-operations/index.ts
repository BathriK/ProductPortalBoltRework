
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { operation, ...params } = await req.json()
    console.log(`Processing operation: ${operation}`, params)

    let result
    
    switch (operation) {
      case 'getPortfolios':
        const { data: portfoliosData, error: portfoliosError } = await supabase
          .from('Portfolios')
          .select('*')
          .eq('Active', true)
        
        if (portfoliosError) throw portfoliosError
        result = portfoliosData || []
        break

      case 'getProductsByPortfolio':
        const { data: productsData, error: productsError } = await supabase
          .from('Products')
          .select('*')
          .eq('PortfolioID', params.portfolioId)
          .eq('Active', true)

        if (productsError) throw productsError
        result = productsData || []
        break

      case 'getProductData':
        const [
          { data: metricsData },
          { data: goalsData },
          { data: plansData },
          { data: notesData },
          { data: roadmapData }
        ] = await Promise.all([
          supabase.from('Metrics').select('*').eq('ProductID', params.productId),
          supabase.from('ReleaseGoals').select('*').eq('ProductID', params.productId),
          supabase.from('ReleasePlan').select('*').eq('ProductID', params.productId),
          supabase.from('ReleaseNotes').select('*').eq('ProductID', params.productId),
          supabase.from('Roadmap').select('*').eq('ProductID', params.productId)
        ])

        result = {
          metrics: metricsData || [],
          goals: goalsData || [],
          plans: plansData || [],
          notes: notesData || [],
          roadmap: roadmapData || []
        }
        break

      case 'getProductDataFiltered':
        const month = params.month
        const year = params.year
        
        const [
          { data: filteredMetrics },
          { data: filteredGoals },
          { data: filteredPlans },
          { data: filteredNotes },
          { data: filteredRoadmap }
        ] = await Promise.all([
          supabase.from('Metrics').select('*')
            .eq('ProductID', params.productId)
            .eq('Month', month)
            .eq('Year', year),
          supabase.from('ReleaseGoals').select('*')
            .eq('ProductID', params.productId)
            .eq('Month', month)
            .eq('Year', year),
          supabase.from('ReleasePlan').select('*')
            .eq('ProductID', params.productId)
            .eq('Month', month)
            .eq('Year', year),
          supabase.from('ReleaseNotes').select('*')
            .eq('ProductID', params.productId)
            .eq('Month', month)
            .eq('Year', year),
          supabase.from('Roadmap').select('*')
            .eq('ProductID', params.productId)
            .eq('Year', year)
        ])

        // Return data with DB field names - frontend will handle transformation
        result = {
          metrics: filteredMetrics || [],
          goals: filteredGoals || [],
          plans: filteredPlans || [],
          notes: filteredNotes || [],
          roadmap: filteredRoadmap || []
        }
        break

      case 'saveMetrics':
        // Delete existing metrics for this period
        await supabase
          .from('Metrics')
          .delete()
          .eq('ProductID', params.productId)
          .eq('Month', params.month)
          .eq('Year', params.year)

        const metricsToInsert = params.metrics.map(metric => ({
          ProductID: params.productId,
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit,
          MonthlyTarget: metric.monthlyTarget,
          AnnualTarget: metric.annualTarget,
          Month: params.month,
          Year: params.year,
          Status: metric.status,
          notes: metric.notes,
          Description: metric.description,
          timestamp: metric.timestamp
        }))

        if (metricsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('Metrics')
            .insert(metricsToInsert)

          if (insertError) throw insertError
        }
        result = { success: true }
        break

      case 'saveReleaseGoals':
        // Delete existing goals for this period
        await supabase
          .from('ReleaseGoals')
          .delete()
          .eq('ProductID', params.productId)
          .eq('Month', params.month)
          .eq('Year', params.year)

        const goalsToInsert = params.goals.map(goal => ({
          ProductID: params.productId,
          Month: params.month,
          Year: params.year,
          Goal: goal.description,
          CurrentState: goal.currentState,
          TargetState: goal.targetState,
          CreatedOn: new Date().toISOString().split('T')[0],
          Version: 1
        }))

        if (goalsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('ReleaseGoals')
            .insert(goalsToInsert)

          if (insertError) throw insertError
        }
        result = { success: true }
        break

      case 'saveReleasePlans':
        // Delete existing plans for this period
        await supabase
          .from('ReleasePlan')
          .delete()
          .eq('ProductID', params.productId)
          .eq('Month', params.month)
          .eq('Year', params.year)

        const plansToInsert = params.plans.map(plan => ({
          ProductID: params.productId,
          Month: params.month,
          Year: params.year,
          FeatureName: plan.title,
          Description: plan.description,
          Category: plan.category,
          Priority: plan.priority,
          Source: plan.source,
          owner: plan.owner,
          Status: plan.status,
          CreatedOn: new Date().toISOString().split('T')[0],
          Version: 1
        }))

        if (plansToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('ReleasePlan')
            .insert(plansToInsert)

          if (insertError) throw insertError
        }
        result = { success: true }
        break

      case 'saveRoadmap':
        console.log('Saving roadmap:', params)
        
        // Get next version number
        const { data: existingRoadmaps } = await supabase
          .from('Roadmap')
          .select('Version')
          .eq('ProductID', params.productId)
          .eq('Year', params.year)
          .order('Version', { ascending: false })
          .limit(1)
        
        const nextVersion = (existingRoadmaps?.[0]?.Version || 0) + 1
        
        const roadmapToInsert = {
          ProductID: params.productId,
          Year: params.year,
          Link: params.roadmapLink,
          CreatedOn: new Date().toISOString().split('T')[0],
          Version: nextVersion
        }

        const { data: insertedRoadmap, error: insertError } = await supabase
          .from('Roadmap')
          .insert([roadmapToInsert])
          .select()

        if (insertError) {
          console.error('Error inserting roadmap:', insertError)
          throw insertError
        }

        console.log('Roadmap inserted successfully:', insertedRoadmap)
        result = { success: true, data: insertedRoadmap }
        break

      case 'saveReleaseNotes':
        // Get next version number
        const { data: existingNotes } = await supabase
          .from('ReleaseNotes')
          .select('Version')
          .eq('ProductID', params.productId)
          .eq('Month', params.month)
          .eq('Year', params.year)
          .order('Version', { ascending: false })
          .limit(1)
        
        const nextNotesVersion = (existingNotes?.[0]?.Version || 0) + 1

        const noteToInsert = {
          ProductID: params.productId,
          Month: params.month,
          Year: params.year,
          ReleaseNotesLink: params.releaseNotesLink,
          CreatedOn: new Date().toISOString().split('T')[0],
          Version: nextNotesVersion
        }

        const { error: notesInsertError } = await supabase
          .from('ReleaseNotes')
          .insert([noteToInsert])

        if (notesInsertError) throw notesInsertError
        result = { success: true }
        break

      default:
        throw new Error(`Unknown operation: ${operation}`)
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )

  } catch (error) {
    console.error('Error in data-operations:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})
