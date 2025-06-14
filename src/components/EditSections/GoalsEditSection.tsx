import React, { useState } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import DataImportGrid from '../DataImportGrid';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { usePermissions } from '../../contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const GoalsEditSection: React.FC = () => {
  const { canDelete } = usePermissions();
  const [saving, setSaving] = useState(false);
  
  const {
    product,
    portfolio,
    goalItems,
    setGoalItems,
    goalMonth,
    goalYear,
    handleGoalsMonthYearChange
  } = useProductEdit();
  
  const headers = ['Goal Description', 'Current State', 'Target State'];
  
  const goalsData = goalItems.map(goal => [
    goal.description,
    goal.currentState,
    goal.targetState
  ]);
  
  const handleSaveGoals = (data: string[][]) => {
    const updatedGoals = data.map((row, index) => {
      const existingGoal = index < goalItems.length ? goalItems[index] : null;
      
      return {
        id: existingGoal?.id || `goal-item-new-${index}-${Date.now()}`,
        description: row[0] || '',
        currentState: row[1] || '',
        targetState: row[2] || '',
        status: existingGoal?.status || 'planned'
      };
    }).filter(goal => goal.description.trim() !== '');
    
    setGoalItems(updatedGoals);
  };

  const handleSave = async () => {
    if (!product) {
      toast({
        title: "Error",
        description: "Product data is missing",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    try {
      // Create a single ReleaseGoal with the combined description from all goals
      const combinedDescription = goalItems.map(g => g.description).join('; ');
      const combinedCurrentState = goalItems.map(g => g.currentState).join('; ');
      const combinedTargetState = goalItems.map(g => g.targetState).join('; ');
      
      const releaseGoals = [{
        id: `goals-${goalMonth}-${goalYear}-${Date.now()}`,
        month: goalMonth,
        year: goalYear,
        description: combinedDescription || 'No goals defined',
        currentState: combinedCurrentState || 'No current state defined',
        targetState: combinedTargetState || 'No target state defined',
        createdAt: new Date().toISOString(),
        version: 1,
        goals: goalItems.filter(goal => goal.description.trim() !== '')
      }];

      const success = await saveProductChanges(product.id, {
        releaseGoals
      });

      if (success) {
        toast({
          title: "Success",
          description: "Goals saved successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save goals",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Release Goals</h2>
        <MonthYearSelector
          selectedMonth={goalMonth}
          selectedYear={goalYear}
          onChange={handleGoalsMonthYearChange}
          className="compact"
        />
      </div>
      
      <DataImportGrid
        title=""
        description=""
        headers={headers}
        initialData={goalsData}
        onSave={handleSaveGoals}
        allowDelete={canDelete}
        allowAdd={canDelete}
      />
      
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2"
        >
          <Save size={16} />
          <span>{saving ? 'Saving...' : 'Save Goals'}</span>
        </Button>
      </div>
    </div>
  );
};

export default GoalsEditSection;