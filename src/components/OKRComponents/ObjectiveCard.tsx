
import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit, ArrowRight } from 'lucide-react';
import type { ProductObjective } from '../../lib/types';

interface ObjectiveCardProps {
  objective: ProductObjective;
  canEdit: boolean;
  onEdit: (objectiveId: string) => void;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  canEdit,
  onEdit
}) => {
  const getStatusBadge = (status: ProductObjective['status']) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 text-xs">Completed</Badge>;
      case 'In Progress':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">In Progress</Badge>;
      case 'Not Started':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200 text-xs">Not Started</Badge>;
    }
  };

  const handleEditClick = () => {
    console.log('ObjectiveCard edit button clicked:', objective.id);
    onEdit(objective.id);
  };

  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      {/* Objective Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="bg-tnq-blue text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {objective.priority}
            </span>
            <h3 className="font-semibold text-gray-900 text-xl">{objective.title}</h3>
            {getStatusBadge(objective.status)}
          </div>
          <p className="text-gray-700 text-sm mb-4 ml-11">{objective.description}</p>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEditClick}
            className="text-tnq-blue hover:text-tnq-blue/80"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Initiative-Benefit Groups */}
      <div className="space-y-6 ml-11">
        {objective.initiatives.map((initiative) => {
          // Find related benefits for this initiative (you can implement your own logic here)
          const relatedBenefits = objective.expectedBenefits.filter(benefit => 
            benefit.description.toLowerCase().includes(initiative.title.toLowerCase().split(' ')[0]) ||
            initiative.description.toLowerCase().includes(benefit.title.toLowerCase().split(' ')[0])
          );

          // If no related benefits found, show all benefits for the first initiative
          const benefitsToShow = relatedBenefits.length > 0 ? relatedBenefits : 
            (objective.initiatives.indexOf(initiative) === 0 ? objective.expectedBenefits : []);

          return (
            <div key={initiative.id} className="border-l-2 border-gray-200 pl-6">
              {/* Initiative */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-tnq-blue rounded-full"></div>
                  <h4 className="font-medium text-gray-800 text-base">
                    Initiative: {initiative.title}
                  </h4>
                  <Badge variant="outline" className="text-xs">
                    {initiative.status}
                  </Badge>
                </div>
                <p className="text-gray-600 text-sm ml-4">{initiative.description}</p>
                <p className="text-gray-500 text-xs ml-4 mt-1">Target: {initiative.targetDate}</p>
                {initiative.progress > 0 && (
                  <div className="ml-4 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-tnq-blue rounded-full transition-all"
                          style={{ width: `${initiative.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{initiative.progress}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Related Benefits */}
              {benefitsToShow.map((benefit) => (
                <div key={benefit.id} className="ml-4 mb-3">
                  <div className="flex items-start gap-2">
                    <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-green-800 text-sm">Benefit: {benefit.title}</span>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {benefit.metricType}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{benefit.description}</p>
                      <p className="text-green-700 font-medium text-sm mt-1">Target: {benefit.targetValue}</p>
                    </div>
                  </div>
                </div>
              ))}

              {benefitsToShow.length === 0 && (
                <div className="ml-4 text-gray-400 text-sm italic">
                  No specific benefits linked to this initiative
                </div>
              )}
            </div>
          );
        })}

        {/* Show any unlinked benefits */}
        {objective.expectedBenefits.filter(benefit => 
          !objective.initiatives.some(initiative => 
            benefit.description.toLowerCase().includes(initiative.title.toLowerCase().split(' ')[0]) ||
            initiative.description.toLowerCase().includes(benefit.title.toLowerCase().split(' ')[0])
          )
        ).length > 0 && objective.initiatives.length > 1 && (
          <div className="border-l-2 border-gray-200 pl-6">
            <h4 className="font-medium text-gray-800 text-base mb-3">Additional Expected Benefits:</h4>
            {objective.expectedBenefits.filter(benefit => 
              !objective.initiatives.some(initiative => 
                benefit.description.toLowerCase().includes(initiative.title.toLowerCase().split(' ')[0]) ||
                initiative.description.toLowerCase().includes(benefit.title.toLowerCase().split(' ')[0])
              )
            ).map((benefit) => (
              <div key={benefit.id} className="ml-4 mb-3">
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-green-800 text-sm">Benefit: {benefit.title}</span>
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {benefit.metricType}
                      </Badge>
                    </div>
                    <p className="text-gray-600 text-sm">{benefit.description}</p>
                    <p className="text-green-700 font-medium text-sm mt-1">Target: {benefit.targetValue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
