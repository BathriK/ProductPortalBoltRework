import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Plus, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { ObjectiveCard } from './ObjectiveCard';
import { ObjectiveForm } from './ObjectiveForm';
import type { Product } from '../../lib/types';

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

interface ProductSectionProps {
  product: Product;
  objectives: ProductObjective[];
  isExpanded: boolean;
  canEdit: boolean;
  addingNew: string | null;
  newObjective: Partial<ProductObjective>;
  setNewObjective: React.Dispatch<React.SetStateAction<Partial<ProductObjective>>>;
  onToggleSection: (productId: string) => void;
  onAddNew: (productId: string) => void;
  onEdit: (objectiveId: string) => void;
  onSaveObjective: (productId: string) => void;
  onCancelAdd: () => void;
}

export const ProductSection: React.FC<ProductSectionProps> = ({
  product,
  objectives,
  isExpanded,
  canEdit,
  addingNew,
  newObjective,
  setNewObjective,
  onToggleSection,
  onAddNew,
  onEdit,
  onSaveObjective,
  onCancelAdd
}) => {
  // Get the latest objectives (sorted by priority)
  const sortedObjectives = [...objectives].sort((a, b) => a.priority - b.priority);

  return (
    <Card className="border-l-4 border-l-tnq-blue">
      <Collapsible 
        open={isExpanded} 
        onOpenChange={() => onToggleSection(product.id)}
      >
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-4 cursor-pointer bg-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-tnq-blue rounded-sm"></div>
                <CardTitle className="text-xl font-semibold text-tnq-navy">{product.name}</CardTitle>
                <Badge variant="outline" className="text-xs bg-white">
                  {objectives.length} Objective{objectives.length !== 1 ? 's' : ''}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNew(product.id);
                    }}
                    size="sm"
                    className="bg-tnq-blue hover:bg-tnq-blue/90 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Objective
                  </Button>
                )}
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Add New Objective Form */}
            {addingNew === product.id && canEdit && (
              <div className="mb-6">
                <ObjectiveForm
                  productId={product.id}
                  newObjective={newObjective}
                  setNewObjective={setNewObjective}
                  onSave={onSaveObjective}
                  onCancel={onCancelAdd}
                />
              </div>
            )}

            {/* Objectives Display */}
            <div className="space-y-6">
              {sortedObjectives.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  canEdit={canEdit}
                  onEdit={onEdit}
                />
              ))}
            </div>

            {objectives.length === 0 && (
              <div className="text-center py-12">
                <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-sm mb-4">No product objectives for {product.name}</p>
                {canEdit && (
                  <Button 
                    onClick={() => onAddNew(product.id)}
                    size="sm"
                    className="bg-tnq-blue hover:bg-tnq-blue/90 text-white"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add First Objective
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};