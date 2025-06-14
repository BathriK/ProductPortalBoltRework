import { createClient } from '@supabase/supabase-js';
import { createEdgeFunctionHandler } from 'supabase-edge-middleware';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

export default createEdgeFunctionHandler(async (req, ctx) => {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.productId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Product ID is required' }),
        { status: 400 }
      );
    }

    // Start transaction
    const { error: transactionError } = await supabaseAdmin.rpc('start_transaction');
    if (transactionError) {
      return new Response(
        JSON.stringify({ success: false, error: transactionError.message }),
        { status: 500 }
      );
    }

    try {
      // Test data
      const testProductId = 'test-product-1';
      const testData = {
        productId: testProductId,
        goals: [
          {
            Goal: 'Test Goal 1',
            CurrentState: 'In Progress',
            TargetState: 'Completed',
            Month: 6,
            Year: 2025,
            Remarks: 'Test remarks',
            ThemeId: 'test-theme-1'
          }
        ],
        plans: [
          {
            FeatureName: 'Test Feature',
            Description: 'Test description',
            Category: 'New Feature',
            Priority: 'High',
            Source: 'Internal',
            SourceName: 'Test Source',
            Status: 'Planning',
            owner: 'test-owner',
            Month: 6,
            Year: 2025,
            GoalId: 'test-goal-1'
          }
        ],
        notes: [
          {
            ReleaseNotesLink: 'https://test.com/release-notes',
            Version: '1.0.0',
            CreatedOn: new Date().toISOString()
          }
        ],
        roadmap: {
          version: '1.0',
          link: 'https://test.com/roadmap',
          createdOn: new Date().toISOString()
        },
        roadmapDetails: [
          {
            version: '1.0',
            detail: 'Test roadmap detail',
            createdOn: new Date().toISOString()
          }
        ]
      };

      // Save release goals if present
      if (testData.goals) {
        const goalsPromises = testData.goals.map(goal => 
          supabaseAdmin
            .from('ReleaseGoals')
            .upsert({
              ProductID: testData.productId,
              Goal: goal.Goal,
              CurrentState: goal.CurrentState,
              TargetState: goal.TargetState,
              Month: goal.Month,
              Year: goal.Year,
              Remarks: goal.Remarks,
              ThemeId: goal.ThemeId
            })
        );

        const goalsResults = await Promise.all(goalsPromises);
        const goalsErrors = goalsResults.filter(result => result.error).map(result => result.error);
        
        if (goalsErrors.length > 0) {
          throw goalsErrors[0];
        }
      }

      // Save release plans if present
      if (testData.plans) {
        const plansPromises = testData.plans.map(plan => 
          supabaseAdmin
            .from('ReleasePlan')
            .upsert({
              ProductID: testData.productId,
              FeatureName: plan.FeatureName,
              Description: plan.Description,
              Category: plan.Category,
              Priority: plan.Priority,
              Source: plan.Source,
              SourceName: plan.SourceName,
              Status: plan.Status,
              owner: plan.owner,
              Month: plan.Month,
              Year: plan.Year,
              GoalId: plan.GoalId
            })
        );

        const plansResults = await Promise.all(plansPromises);
        const plansErrors = plansResults.filter(result => result.error).map(result => result.error);
        
        if (plansErrors.length > 0) {
          throw plansErrors[0];
        }
      }

      // Save release notes if present
      if (testData.notes) {
        const notesPromises = testData.notes.map(note => 
          supabaseAdmin
            .from('ReleaseNotes')
            .upsert({
              ProductID: testData.productId,
              ReleaseNotesLink: note.ReleaseNotesLink,
              Version: note.Version,
              CreatedOn: note.CreatedOn
            })
        );

        const notesResults = await Promise.all(notesPromises);
        const notesErrors = notesResults.filter(result => result.error).map(result => result.error);
        
        if (notesErrors.length > 0) {
          throw notesErrors[0];
        }
      }

      // Save roadmap if present
      if (testData.roadmap) {
        const { error: roadmapError } = await supabaseAdmin
          .from('Roadmap')
          .upsert({
            ProductID: testData.productId,
            Version: testData.roadmap.version,
            Link: testData.roadmap.link,
            CreatedOn: testData.roadmap.createdOn
          });

        if (roadmapError) {
          throw roadmapError;
        }
      }

      // Save roadmap details if present
      if (testData.roadmapDetails) {
        const detailsPromises = testData.roadmapDetails.map(detail => 
          supabaseAdmin
            .from('RoadmapDetail')
            .upsert({
              ProductID: testData.productId,
              Version: detail.version,
              Detail: detail.detail,
              CreatedOn: detail.createdOn
            })
        );

        const detailsResults = await Promise.all(detailsPromises);
        const detailsErrors = detailsResults.filter(result => result.error).map(result => result.error);
        
        if (detailsErrors.length > 0) {
          throw detailsErrors[0];
        }
      }

      // Commit transaction
      const { error: commitError } = await supabaseAdmin.rpc('commit_transaction');
      if (commitError) {
        throw commitError;
      }

      // Verify data was saved
      const { data: savedGoals } = await supabaseAdmin
        .from('ReleaseGoals')
        .select('*')
        .eq('ProductID', testData.productId);

      const { data: savedPlans } = await supabaseAdmin
        .from('ReleasePlan')
        .select('*')
        .eq('ProductID', testData.productId);

      const { data: savedNotes } = await supabaseAdmin
        .from('ReleaseNotes')
        .select('*')
        .eq('ProductID', testData.productId);

      const { data: savedRoadmap } = await supabaseAdmin
        .from('Roadmap')
        .select('*')
        .eq('ProductID', testData.productId);

      const { data: savedDetails } = await supabaseAdmin
        .from('RoadmapDetail')
        .select('*')
        .eq('ProductID', testData.productId);

      return new Response(
        JSON.stringify({ 
          success: true,
          savedData: {
            goals: savedGoals,
            plans: savedPlans,
            notes: savedNotes,
            roadmap: savedRoadmap,
            details: savedDetails
          }
        })
      );

    } catch (error) {
      // Rollback transaction on error
      const { error: rollbackError } = await supabaseAdmin.rpc('rollback_transaction');
      if (rollbackError) {
        console.error('Error rolling back transaction:', rollbackError);
      }

      throw error;
    }

  } catch (error) {
    console.error('Error in saveProductData test:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500 }
    );
  }
