// src/components/ProductDetailTabs/GoalsTabContent.tsx
import React from 'react';
import GoalsTable from '../GoalsTable';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { GoalItem, ReleaseGoal } from '@/lib/types';
import { getLatestVersionedItem } from '@/lib/utils';

export interface GoalsTabContentProps {
  productId: string;
  selectedMonth: number;
  selectedYear: number;
  releaseGoalVersions: ReleaseGoal[]; // Changed to ReleaseGoal[]
  selectedGoalId: string | null;
  onMonthYearChange: (month: number, year: number) => void;
  onVersionSelect: (id: string) => void;
  isEditMode?: boolean;
}

const GoalsTabContent: React.FC<GoalsTabContentProps> = ({
  productId,
  selectedMonth,
  selectedYear,
  releaseGoalVersions,
  selectedGoalId,
  onMonthYearChange,
  onVersionSelect,
  isEditMode = false
}) => {
  const convertVersionsForHistory = (items: any[]) => {
    return items.map(item => ({
      id: item.id,
      version: typeof item.version === 'string' ? parseFloat(item.version) : item.version,
      createdAt: item.createdAt
    }));
  };

  // Get the selected goal or the latest if none selected
  const getSelectedGoal = () => {
    if (selectedGoalId) {
      return releaseGoalVersions.find(goal => goal.id === selectedGoalId) || getLatestVersionedItem(releaseGoalVersions);
    }
    return getLatestVersionedItem(releaseGoalVersions);
  };

  const selectedGoal = getSelectedGoal();

  // Extract goal items from the selected goal
  const getGoalItems = (): GoalItem[] => {
    if (!selectedGoal) return [];
    
    // If the goal has nested goals, return those
    if (selectedGoal.goals && selectedGoal.goals.length > 0) {
      return selectedGoal.goals;
    }
    
    // Otherwise, create a goal item from the goal itself
    return [{
      id: selectedGoal.id,
      description: selectedGoal.description,
      currentState: selectedGoal.currentState,
      targetState: selectedGoal.targetState,
      status: selectedGoal.status,
      owner: selectedGoal.owner,
      priority: selectedGoal.priority,
      category: selectedGoal.category
    }];
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-blue-600">Release Goals</h2>
          {selectedGoal && (
            <span className="text-sm text-gray-500">v{selectedGoal.version}</span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <MonthYearSelector 
            selectedMonth={selectedMonth} 
            selectedYear={selectedYear} 
            onChange={onMonthYearChange} 
            className="compact" 
          />
          <VersionHistory 
            items={convertVersionsForHistory(releaseGoalVersions)} 
            onSelect={onVersionSelect} 
            currentId={selectedGoalId || ""} 
            hideNewVersion={true}
          />
        </div>
      </div>
      
      {getGoalItems().length > 0 ? (
        <GoalsTable goals={getGoalItems()} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No release goals available for this period</p>
        </div>
      )}
    </div>
  );
};

export default GoalsTabContent;