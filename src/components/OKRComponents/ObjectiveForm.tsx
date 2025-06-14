
import React from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Plus, Save } from 'lucide-react';

interface Initiative {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

interface ExpectedBenefit {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  metricType: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

interface ProductObjective {
  id: string;
  title: string;
  description: string;
  productId: string;
  initiatives: Initiative[];
  expectedBenefits: ExpectedBenefit[];
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: number;
}

interface ObjectiveFormProps {
  productId: string;
  newObjective: Partial<ProductObjective>;
  setNewObjective: React.Dispatch<React.SetStateAction<Partial<ProductObjective>>>;
  onSave: (productId: string) => void;
  onCancel: () => void;
}

export const ObjectiveForm: React.FC<ObjectiveFormProps> = ({
  productId,
  newObjective,
  setNewObjective,
  onSave,
  onCancel
}) => {
  const addInitiative = () => {
    setNewObjective(prev => ({
      ...prev,
      initiatives: [
        ...(prev.initiatives || []),
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          targetDate: '',
          status: 'Not Started',
          progress: 0
        }
      ]
    }));
  };

  const addExpectedBenefit = () => {
    setNewObjective(prev => ({
      ...prev,
      expectedBenefits: [
        ...(prev.expectedBenefits || []),
        {
          id: Date.now().toString(),
          title: '',
          description: '',
          targetValue: '',
          metricType: '',
          status: 'Not Started'
        }
      ]
    }));
  };

  return (
    <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
      <h3 className="text-lg font-medium text-blue-900 mb-4">Add New Product Objective</h3>
      
      {/* Objective Section */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Objective Title</label>
        <Input
          value={newObjective.title || ''}
          onChange={(e) => setNewObjective({ ...newObjective, title: e.target.value })}
          placeholder="e.g., Make structuring more efficient - TAT, TT and FTR"
          className="text-sm mb-2"
        />
        <Textarea
          value={newObjective.description || ''}
          onChange={(e) => setNewObjective({ ...newObjective, description: e.target.value })}
          placeholder="Objective description"
          className="text-sm"
          rows={2}
        />
      </div>

      {/* Priority */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
        <Input
          type="number"
          min="1"
          value={newObjective.priority || 1}
          onChange={(e) => setNewObjective({ ...newObjective, priority: parseInt(e.target.value) })}
          className="text-sm w-20"
        />
      </div>

      {/* Initiatives Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Initiatives</label>
          <Button onClick={addInitiative} size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1" />
            Add Initiative
          </Button>
        </div>
        {newObjective.initiatives?.map((initiative, index) => (
          <div key={initiative.id} className="p-3 border border-gray-200 rounded mb-2 bg-white">
            <Input
              value={initiative.title}
              onChange={(e) => {
                const updated = [...(newObjective.initiatives || [])];
                updated[index] = { ...updated[index], title: e.target.value };
                setNewObjective({ ...newObjective, initiatives: updated });
              }}
              placeholder="e.g., Rollout to all FTV accounts"
              className="text-sm mb-2"
            />
            <Textarea
              value={initiative.description}
              onChange={(e) => {
                const updated = [...(newObjective.initiatives || [])];
                updated[index] = { ...updated[index], description: e.target.value };
                setNewObjective({ ...newObjective, initiatives: updated });
              }}
              placeholder="Initiative description"
              className="text-sm"
              rows={1}
            />
          </div>
        ))}
      </div>

      {/* Expected Benefits Section */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">Expected Benefits</label>
          <Button onClick={addExpectedBenefit} size="sm" variant="outline">
            <Plus className="h-3 w-3 mr-1" />
            Add Benefit
          </Button>
        </div>
        {newObjective.expectedBenefits?.map((benefit, index) => (
          <div key={benefit.id} className="p-3 border border-gray-200 rounded mb-2 bg-white">
            <Input
              value={benefit.title}
              onChange={(e) => {
                const updated = [...(newObjective.expectedBenefits || [])];
                updated[index] = { ...updated[index], title: e.target.value };
                setNewObjective({ ...newObjective, expectedBenefits: updated });
              }}
              placeholder="e.g., LeMans Deployment"
              className="text-sm mb-2"
            />
            <Textarea
              value={benefit.description}
              onChange={(e) => {
                const updated = [...(newObjective.expectedBenefits || [])];
                updated[index] = { ...updated[index], description: e.target.value };
                setNewObjective({ ...newObjective, expectedBenefits: updated });
              }}
              placeholder="Benefit description with specific metrics"
              className="text-sm mb-2"
              rows={2}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={benefit.targetValue}
                onChange={(e) => {
                  const updated = [...(newObjective.expectedBenefits || [])];
                  updated[index] = { ...updated[index], targetValue: e.target.value };
                  setNewObjective({ ...newObjective, expectedBenefits: updated });
                }}
                placeholder="Target value (e.g., 90% FTR)"
                className="text-sm"
              />
              <Input
                value={benefit.metricType}
                onChange={(e) => {
                  const updated = [...(newObjective.expectedBenefits || [])];
                  updated[index] = { ...updated[index], metricType: e.target.value };
                  setNewObjective({ ...newObjective, expectedBenefits: updated });
                }}
                placeholder="Metric type (e.g., Performance)"
                className="text-sm"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button 
          onClick={() => onSave(productId)} 
          size="sm"
          className="bg-tnq-blue hover:bg-tnq-blue/90 text-white"
        >
          <Save className="h-3 w-3 mr-1" />
          Save Objective
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel} 
          size="sm"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};
