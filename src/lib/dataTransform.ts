
// Centralized data transformation layer - DB structure is primary source of truth
import { Metric, ReleaseGoal, ReleasePlan, ReleaseNote, Roadmap, GoalItem, ReleasePlanItem } from './types';

// Transform database roadmap to frontend format
export const transformRoadmapFromDB = (dbRoadmap: any): Roadmap => ({
  id: dbRoadmap.ID?.toString() || '',
  year: dbRoadmap.Year || new Date().getFullYear(),
  link: dbRoadmap.Link || '',
  createdAt: dbRoadmap.CreatedOn || new Date().toISOString().split('T')[0],
  version: dbRoadmap.Version?.toString() || "1",
  items: [] // Roadmap items come from RoadmapDetail table
});

// Transform database metrics to frontend format
export const transformMetricFromDB = (dbMetric: any): Metric => ({
  id: dbMetric.id?.toString() || '',
  name: dbMetric.MetricName || '',
  value: dbMetric.Value || 0,
  unit: dbMetric.Unit || '',
  monthlyTarget: dbMetric.MonthlyTarget || 0,
  annualTarget: dbMetric.AnnualTarget || 0,
  month: dbMetric.Month || 1,
  year: dbMetric.Year || new Date().getFullYear(),
  status: dbMetric.Status as "on-track" | "at-risk" | "off-track" || "on-track",
  notes: dbMetric.notes || '',
  description: dbMetric.Description || '',
  timestamp: dbMetric.timestamp || new Date().toISOString()
});

// Transform database release goals to frontend format
export const transformReleaseGoalFromDB = (dbGoal: any): ReleaseGoal => ({
  id: dbGoal.ID?.toString() || '',
  month: dbGoal.Month || 1,
  year: dbGoal.Year || new Date().getFullYear(),
  productId: dbGoal.ProductID || '',
  goal: dbGoal.Goal || '',
  currentState: dbGoal.CurrentState || '',
  targetState: dbGoal.TargetState || '',
  createdAt: dbGoal.CreatedOn || new Date().toISOString().split('T')[0],
  version: dbGoal.Version || 1,
  remarks: dbGoal.remarks || '',
  themeId: dbGoal.ThemeID || '',
  // Backward compatibility for edit forms
  goals: [{
    id: dbGoal.ID?.toString() || '',
    description: dbGoal.Goal || '',
    currentState: dbGoal.CurrentState || '',
    targetState: dbGoal.TargetState || '',
    status: 'planned' as const
  }],
  futureState: dbGoal.TargetState || '',
  name: dbGoal.Goal || ''
});

// Transform database release plans to frontend format
export const transformReleasePlanFromDB = (dbPlan: any): ReleasePlan => ({
  id: dbPlan.ID?.toString() || '',
  month: dbPlan.Month || 1,
  year: dbPlan.Year || new Date().getFullYear(),
  productId: dbPlan.ProductID || '',
  featureName: dbPlan.FeatureName || '',
  description: dbPlan.Description || '',
  category: dbPlan.Category as any,
  priority: dbPlan.Priority as any,
  source: dbPlan.Source as any,
  sourceName: dbPlan.SourceName || '',
  owner: dbPlan.owner || '',
  status: dbPlan.Status as any || 'planned',
  createdAt: dbPlan.CreatedOn || new Date().toISOString().split('T')[0],
  version: dbPlan.Version || 1,
  remarks: dbPlan.remarks || '',
  goalId: dbPlan.GoalID || undefined,
  // Backward compatibility for edit forms
  items: [{
    id: dbPlan.ID?.toString() || '',
    title: dbPlan.FeatureName || '',
    description: dbPlan.Description || '',
    category: dbPlan.Category as any,
    priority: dbPlan.Priority as any,
    source: dbPlan.Source as any,
    targetDate: dbPlan.CreatedOn || new Date().toISOString(),
    owner: dbPlan.owner || '',
    status: dbPlan.Status as any || 'planned'
  }],
  name: dbPlan.FeatureName || ''
});

// Transform database release notes to frontend format
export const transformReleaseNoteFromDB = (dbNote: any): ReleaseNote => ({
  id: dbNote.ID?.toString() || '',
  month: dbNote.Month || 1,
  year: dbNote.Year || new Date().getFullYear(),
  productId: dbNote.ProductID || '',
  releaseNotesLink: dbNote.ReleaseNotesLink || '',
  createdAt: dbNote.CreatedOn || new Date().toISOString().split('T')[0],
  version: dbNote.Version || 1,
  // Backward compatibility
  link: dbNote.ReleaseNotesLink || '',
  highlights: [],
  details: []
});

// Group goals by month/year for edit forms compatibility
export const groupGoalsByPeriod = (goals: any[]): any[] => {
  const goalsByPeriod = goals.reduce((acc, goal) => {
    const key = `${goal.Month}-${goal.Year}`;
    if (!acc[key]) {
      acc[key] = {
        id: `goals-${goal.Month}-${goal.Year}`,
        productId: goal.ProductID,
        month: goal.Month,
        year: goal.Year,
        goals: [],
        createdAt: goal.CreatedOn || new Date().toISOString().split('T')[0],
        version: goal.Version || 1
      };
    }
    acc[key].goals.push({
      id: goal.ID?.toString() || '',
      description: goal.Goal || '',
      currentState: goal.CurrentState || '',
      targetState: goal.TargetState || '',
      status: 'planned' as const
    });
    return acc;
  }, {} as any);
  
  return Object.values(goalsByPeriod);
};

// Group plans by month/year for edit forms compatibility
export const groupPlansByPeriod = (plans: any[]): any[] => {
  const plansByPeriod = plans.reduce((acc, plan) => {
    const key = `${plan.Month}-${plan.Year}`;
    if (!acc[key]) {
      acc[key] = {
        id: `plan-${plan.Month}-${plan.Year}`,
        productId: plan.ProductID,
        month: plan.Month,
        year: plan.Year,
        items: [],
        createdAt: plan.CreatedOn || new Date().toISOString().split('T')[0],
        version: plan.Version || 1
      };
    }
    acc[key].items.push({
      id: plan.ID?.toString() || '',
      title: plan.FeatureName || '',
      description: plan.Description || '',
      category: plan.Category as any,
      priority: plan.Priority as any,
      source: plan.Source as any,
      owner: plan.owner || '',
      status: plan.Status as any || 'planned',
      targetDate: plan.CreatedOn || new Date().toISOString()
    });
    return acc;
  }, {} as any);
  
  return Object.values(plansByPeriod);
};
