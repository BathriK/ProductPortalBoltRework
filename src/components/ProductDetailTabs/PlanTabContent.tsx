// src/components/ProductDetailTabs/PlanTabContent.tsx
import React from 'react';
import ReleasePlanTable from '../ReleasePlanTable';
import MonthYearSelector from '../MonthYearSelector';
import VersionHistory from '../VersionHistory';
import { ReleasePlan } from '../../lib/types';
import { getLatestVersionedItem } from '@/lib/utils';

export interface PlanTabContentProps {
  productId: string;
  selectedMonth: number;
  selectedYear: number;
  releasePlanVersions: ReleasePlan[]; // Changed to ReleasePlan[]
  selectedPlanId: string | null;
  onMonthYearChange: (month: number, year: number) => void;
  onVersionSelect: (id: string) => void;
  isEditMode?: boolean;
}

const PlanTabContent: React.FC<PlanTabContentProps> = ({
  productId,
  selectedMonth,
  selectedYear,
  releasePlanVersions,
  selectedPlanId,
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

  // Get the selected plan or the latest if none selected
  const getSelectedPlan = () => {
    if (selectedPlanId) {
      return releasePlanVersions.find(plan => plan.id === selectedPlanId) || getLatestVersionedItem(releasePlanVersions);
    }
    return getLatestVersionedItem(releasePlanVersions);
  };

  const selectedPlan = getSelectedPlan();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium text-blue-600">Release Plans</h2>
          {selectedPlan && (
            <span className="text-sm text-gray-500">v{selectedPlan.version}</span>
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
            items={convertVersionsForHistory(releasePlanVersions)} 
            onSelect={onVersionSelect} 
            currentId={selectedPlanId || ""} 
            hideNewVersion={true}
          />
        </div>
      </div>
      
      {selectedPlan ? (
        <ReleasePlanTable plans={[selectedPlan]} />
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No release plans available for this period</p>
        </div>
      )}
    </div>
  );
};

export default PlanTabContent;