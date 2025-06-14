
import React from 'react';
import { Badge } from '../ui/badge';

interface ExpectedBenefit {
  id: string;
  title: string;
  description: string;
  targetValue: string;
  metricType: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
}

interface BenefitItemProps {
  benefit: ExpectedBenefit;
}

export const BenefitItem: React.FC<BenefitItemProps> = ({ benefit }) => {
  return (
    <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="font-medium text-sm text-gray-800">{benefit.title}</div>
        <Badge variant="outline" className="text-xs ml-2">
          {benefit.metricType}
        </Badge>
      </div>
      <div className="text-gray-600 text-xs mb-2">{benefit.description}</div>
      <div className="flex items-center justify-between">
        <span className="text-tnq-blue font-medium text-xs">Target: {benefit.targetValue}</span>
        <Badge variant="outline" className="text-xs">
          {benefit.status}
        </Badge>
      </div>
    </div>
  );
};
