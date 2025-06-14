
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Save, X, Plus, Trash } from 'lucide-react';
import type { ProductObjective } from '../../lib/types';

interface ObjectiveEditDialogProps {
  objective: ProductObjective | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (objective: ProductObjective) => void;
}

export const ObjectiveEditDialog: React.FC<ObjectiveEditDialogProps> = ({
  objective,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedObjective, setEditedObjective] = useState<ProductObjective | null>(null);

  useEffect(() => {
    if (objective) {
      setEditedObjective({ ...objective });
    }
  }, [objective]);

  const handleSave = () => {
    if (editedObjective) {
      onSave(editedObjective);
      onClose();
    }
  };

  const updateInitiative = (index: number, field: string, value: any) => {
    if (!editedObjective) return;
    
    const updatedInitiatives = [...editedObjective.initiatives];
    updatedInitiatives[index] = { ...updatedInitiatives[index], [field]: value };
    
    setEditedObjective({
      ...editedObjective,
      initiatives: updatedInitiatives
    });
  };

  const updateBenefit = (index: number, field: string, value: any) => {
    if (!editedObjective) return;
    
    const updatedBenefits = [...editedObjective.expectedBenefits];
    updatedBenefits[index] = { ...updatedBenefits[index], [field]: value };
    
    setEditedObjective({
      ...editedObjective,
      expectedBenefits: updatedBenefits
    });
  };

  if (!editedObjective) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product Objective</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Objective Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Objective Title</label>
              <Input
                value={editedObjective.title}
                onChange={(e) => setEditedObjective({...editedObjective, title: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editedObjective.description}
                onChange={(e) => setEditedObjective({...editedObjective, description: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Priority</label>
                <Input
                  type="number"
                  value={editedObjective.priority}
                  onChange={(e) => setEditedObjective({...editedObjective, priority: parseInt(e.target.value)})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={editedObjective.status}
                  onValueChange={(value) => setEditedObjective({...editedObjective, status: value as any})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Initiatives */}
          <div>
            <h3 className="text-lg font-medium mb-3">Initiatives</h3>
            {editedObjective.initiatives.map((initiative, index) => (
              <div key={initiative.id} className="border rounded p-4 mb-3">
                <div className="space-y-3">
                  <Input
                    value={initiative.title}
                    onChange={(e) => updateInitiative(index, 'title', e.target.value)}
                    placeholder="Initiative title"
                  />
                  <Textarea
                    value={initiative.description}
                    onChange={(e) => updateInitiative(index, 'description', e.target.value)}
                    placeholder="Initiative description"
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      value={initiative.targetDate}
                      onChange={(e) => updateInitiative(index, 'targetDate', e.target.value)}
                      placeholder="Target date"
                    />
                    <Select
                      value={initiative.status}
                      onValueChange={(value) => updateInitiative(index, 'status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not Started">Not Started</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={initiative.progress}
                      onChange={(e) => updateInitiative(index, 'progress', parseInt(e.target.value))}
                      placeholder="Progress %"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Expected Benefits */}
          <div>
            <h3 className="text-lg font-medium mb-3">Expected Benefits</h3>
            {editedObjective.expectedBenefits.map((benefit, index) => (
              <div key={benefit.id} className="border rounded p-4 mb-3">
                <div className="space-y-3">
                  <Input
                    value={benefit.title}
                    onChange={(e) => updateBenefit(index, 'title', e.target.value)}
                    placeholder="Benefit title"
                  />
                  <Textarea
                    value={benefit.description}
                    onChange={(e) => updateBenefit(index, 'description', e.target.value)}
                    placeholder="Benefit description"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={benefit.targetValue}
                      onChange={(e) => updateBenefit(index, 'targetValue', e.target.value)}
                      placeholder="Target value"
                    />
                    <Input
                      value={benefit.metricType}
                      onChange={(e) => updateBenefit(index, 'metricType', e.target.value)}
                      placeholder="Metric type"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
