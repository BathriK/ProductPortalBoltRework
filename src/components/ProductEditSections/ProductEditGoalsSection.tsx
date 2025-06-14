import React, { useState } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ProductEditGoalsSection: React.FC = () => {
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

  const addNewGoal = () => {
    const newGoal = {
      id: `goal-${Date.now()}`,
      description: '',
      currentState: '',
      targetState: '',
      status: 'planned' as const
    };
    setGoalItems([...goalItems, newGoal]);
  };

  const updateGoal = (index: number, field: string, value: string) => {
    const updatedGoals = [...goalItems];
    updatedGoals[index] = { ...updatedGoals[index], [field]: value };
    setGoalItems(updatedGoals);
  };

  const removeGoal = (index: number) => {
    const updatedGoals = goalItems.filter((_, i) => i !== index);
    setGoalItems(updatedGoals);
  };

  const handleSave = async () => {
    if (!product) return;
    
    setSaving(true);
    try {
      // Create a single ReleaseGoal with combined description
      const combinedDescription = goalItems.map(g => g.description).join('; ');
      const combinedCurrentState = goalItems.map(g => g.currentState).join('; ');
      const combinedTargetState = goalItems.map(g => g.targetState).join('; ');

      const releaseGoals = [{
        id: `goals-${goalMonth}-${goalYear}`,
        month: goalMonth,
        year: goalYear,
        description: combinedDescription || 'No goals defined',
        currentState: combinedCurrentState || 'No current state defined',
        targetState: combinedTargetState || 'No target state defined',
        createdAt: new Date().toISOString(),
        version: 1
      }];

      const success = await saveProductChanges(product.id, {
        releaseGoals
      });

      if (success) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error saving goals:', error);
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-blue-600">Release Goals</h2>
        <MonthYearSelector
          selectedMonth={goalMonth}
          selectedYear={goalYear}
          onChange={handleGoalsMonthYearChange}
          className="compact"
        />
      </div>
      
      <Card className="p-6">
        {goalItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4">No release goals available</p>
            <Button onClick={addNewGoal} className="flex items-center space-x-2">
              <Plus size={16} />
              <span>Add Goal</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Goal Description</TableHead>
                  <TableHead>Current State</TableHead>
                  <TableHead>Target State</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goalItems.map((goal, index) => (
                  <TableRow key={goal.id}>
                    <TableCell>
                      <Textarea
                        value={goal.description}
                        onChange={(e) => updateGoal(index, 'description', e.target.value)}
                        placeholder="Enter goal description"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={goal.currentState}
                        onChange={(e) => updateGoal(index, 'currentState', e.target.value)}
                        placeholder="Current state"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={goal.targetState}
                        onChange={(e) => updateGoal(index, 'targetState', e.target.value)}
                        placeholder="Target state"
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeGoal(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex justify-between pt-4">
              <Button onClick={addNewGoal} variant="outline" className="flex items-center space-x-2">
                <Plus size={16} />
                <span>Add Goal</span>
              </Button>
              
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
        )}
      </Card>
    </div>
  );
};

export default ProductEditGoalsSection;
