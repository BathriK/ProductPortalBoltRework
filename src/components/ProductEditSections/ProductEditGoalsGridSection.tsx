import React, { useState, useEffect } from 'react';
import { useProductEdit } from '../../contexts/ProductEditContext';
import { saveProductChanges } from '../../services/productEditService';
import MonthYearSelector from '../MonthYearSelector';
import { Button } from '@/components/ui/button';
import { Save, Plus, Clipboard, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { getCurrentMonthYear } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const ProductEditGoalsGridSection: React.FC = () => {
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  
  const {
    product,
    portfolio,
    goalItems,
    setGoalItems,
    goalMonth,
    goalYear,
    handleGoalsMonthYearChange
  } = useProductEdit();

  // Set default month/year to current when component mounts
  useEffect(() => {
    const { month, year } = getCurrentMonthYear();
    handleGoalsMonthYearChange(month, year);
  }, []);

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

  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const rows = text.split('\n').filter(row => row.trim());
      const pasteData = rows.map(row => row.split('\t'));
      
      const newGoals = pasteData.map((row, index) => ({
        id: `goal-paste-${Date.now()}-${index}`,
        description: row[0] || '',
        currentState: row[1] || '',
        targetState: row[2] || '',
        status: 'planned' as const
      })).filter(goal => goal.description.trim() !== '');
      
      setGoalItems([...goalItems, ...newGoals]);
    } catch (error) {
      console.error('Failed to paste data:', error);
    }
  };

  const handleSave = async () => {
    if (!product) {
      console.error('Missing product data');
      setSaveStatus('error');
      toast({
        title: "Error",
        description: "Product data is missing",
        variant: "destructive"
      });
      return;
    }
    
    setSaving(true);
    setSaveStatus('idle');
    
    try {
      console.log('Saving goals with params:', {
        productId: product.id,
        goalItems: goalItems.filter(goal => goal.description.trim() !== ''),
        goalMonth,
        goalYear
      });

      // Create a ReleaseGoal object with the combined description from all goals
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
        console.log('Goals saved successfully');
        setSaveStatus('success');
        toast({
          title: "Success",
          description: "Goals saved successfully",
        });
      } else {
        console.error('Failed to save goals');
        setSaveStatus('error');
        toast({
          title: "Error",
          description: "Failed to save goals",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving goals:', error);
      setSaveStatus('error');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const getSaveButtonContent = () => {
    if (saving) {
      return (
        <>
          <Save size={16} className="animate-spin" />
          <span>Saving...</span>
        </>
      );
    }
    
    if (saveStatus === 'success') {
      return (
        <>
          <CheckCircle size={16} />
          <span>Saved!</span>
        </>
      );
    }
    
    if (saveStatus === 'error') {
      return (
        <>
          <XCircle size={16} />
          <span>Save Failed</span>
        </>
      );
    }
    
    return (
      <>
        <Save size={16} />
        <span>Save Goals</span>
      </>
    );
  };
  
  return (
    <div className="space-y-6 font-['Pathway_Extreme']">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-tnq-blue tnq-font">Release Goals</h2>
        <MonthYearSelector
          selectedMonth={goalMonth}
          selectedYear={goalYear}
          onChange={handleGoalsMonthYearChange}
          className="compact tnq-font"
        />
      </div>
      
      <Card className="p-6">
        {goalItems.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p className="mb-4 tnq-font">No release goals available</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={addNewGoal} className="flex items-center space-x-2 tnq-button">
                <Plus size={16} />
                <span>Add Goal</span>
              </Button>
              <Button onClick={handlePasteData} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                <Clipboard size={16} />
                <span>Paste Data</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Table className="tnq-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="tnq-grid-header">Goal Description</TableHead>
                  <TableHead className="tnq-grid-header">Current State</TableHead>
                  <TableHead className="tnq-grid-header">Target State</TableHead>
                  <TableHead className="tnq-grid-header w-20">Delete</TableHead>
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
                        className="w-full tnq-font min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={goal.currentState}
                        onChange={(e) => updateGoal(index, 'currentState', e.target.value)}
                        placeholder="Current state"
                        className="w-full tnq-font min-h-[80px]"
                      />
                    </TableCell>
                    <TableCell>
                      <Textarea
                        value={goal.targetState}
                        onChange={(e) => updateGoal(index, 'targetState', e.target.value)}
                        placeholder="Target state"
                        className="w-full tnq-font min-h-[80px]"
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
              <div className="flex gap-2">
                <Button onClick={addNewGoal} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                  <Plus size={16} />
                  <span>Add Goal</span>
                </Button>
                <Button onClick={handlePasteData} variant="outline" className="flex items-center space-x-2 tnq-button-outline">
                  <Clipboard size={16} />
                  <span>Paste Data</span>
                </Button>
                <Button 
                  onClick={() => setGoalItems([])}
                  variant="outline" 
                  className="flex items-center space-x-2 tnq-button-outline text-red-600 hover:text-red-800"
                >
                  Clear All
                </Button>
              </div>
              
              <Button 
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center space-x-2 tnq-button ${
                  saveStatus === 'success' ? 'bg-green-600 hover:bg-green-700' : 
                  saveStatus === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
                }`}
              >
                {getSaveButtonContent()}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ProductEditGoalsGridSection;
