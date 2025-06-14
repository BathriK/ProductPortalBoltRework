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
      // Save release goals if present
      if (body.goals) {
        const goalsPromises = body.goals.map(goal => 
          supabaseAdmin
            .from('ReleaseGoals')
            .upsert({
              ProductID: body.productId,
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
      if (body.plans) {
        const plansPromises = body.plans.map(plan => 
          supabaseAdmin
            .from('ReleasePlan')
            .upsert({
              ProductID: body.productId,
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
      if (body.notes) {
        const notesPromises = body.notes.map(note => 
          supabaseAdmin
            .from('ReleaseNotes')
            .upsert({
              ProductID: body.productId,
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
      if (body.roadmap) {
        const { error: roadmapError } = await supabaseAdmin
          .from('Roadmap')
          .upsert({
            ProductID: body.productId,
            Version: body.roadmap.version,
            Link: body.roadmap.link,
            CreatedOn: body.roadmap.createdOn
          });

        if (roadmapError) {
          throw roadmapError;
        }
      }

      // Save roadmap details if present
      if (body.roadmapDetails) {
        const detailsPromises = body.roadmapDetails.map(detail => 
          supabaseAdmin
            .from('RoadmapDetail')
            .upsert({
              ProductID: body.productId,
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

      return new Response(
        JSON.stringify({ success: true })
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
    console.error('Error in saveProductData:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500 }
    );
  }
});
