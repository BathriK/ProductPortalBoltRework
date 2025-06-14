
import React from 'react';
import { Badge } from '../ui/badge';

interface Initiative {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'Not Started' | 'In Progress' | 'Completed';
  progress: number;
}

interface InitiativeItemProps {
  initiative: Initiative;
}

export const InitiativeItem: React.FC<InitiativeItemProps> = ({ initiative }) => {
  return (
    <div className="bg-gray-800 text-white p-3 rounded-lg relative">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-tnq-blue rounded-l-lg"></div>
      <div className="ml-2">
        <div className="font-medium text-sm">{initiative.title}</div>
        <div className="text-gray-300 text-xs mt-1">{initiative.description}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-gray-400 text-xs">Due: {initiative.targetDate}</span>
          <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
            {initiative.status}
          </Badge>
        </div>
      </div>
    </div>
  );
};
