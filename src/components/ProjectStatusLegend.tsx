
import React from 'react';

interface StatusType {
  color: string;
  bgColor: string;
  label: string;
}

interface ProjectStatusLegendProps {
  showTitle?: boolean;
  horizontal?: boolean;
}

const ProjectStatusLegend: React.FC<ProjectStatusLegendProps> = ({ 
  showTitle = true,
  horizontal = false
}) => {
  const statuses: StatusType[] = [
    { color: 'bg-green-500', bgColor: 'bg-green-100', label: 'On Track' },
    { color: 'bg-yellow-500', bgColor: 'bg-yellow-100', label: 'At Risk' },
    { color: 'bg-red-500', bgColor: 'bg-red-100', label: 'Blocked' }
  ];

  return (
    <div className={`my-2 ${horizontal ? 'flex items-center gap-4' : ''}`}>
      {showTitle && (
        <h4 className="text-xs font-semibold text-gray-600 mb-1">Status Legend:</h4>
      )}
      <div className={`flex ${horizontal ? 'items-center gap-4' : 'flex-col gap-1'}`}>
        {statuses.map((status) => (
          <div key={status.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${status.color}`} aria-hidden="true" />
            <span className="text-xs text-gray-600">{status.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatusIndicator: React.FC<{ status: string }> = ({ status }) => {
  let colorClass = 'bg-gray-500';
  let bgClass = 'bg-gray-100';
  let label = status;

  switch (status?.toLowerCase()) {
    case 'on track':
    case 'completed':
    case 'done':
      colorClass = 'bg-green-500';
      bgClass = 'bg-green-100';
      break;
    case 'at risk':
    case 'in progress':
    case 'in-progress':
      colorClass = 'bg-yellow-500';
      bgClass = 'bg-yellow-100';
      break;
    case 'blocked':
    case 'delayed':
      colorClass = 'bg-red-500';
      bgClass = 'bg-red-100';
      break;
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${colorClass}`} aria-hidden="true" />
      <span className={`text-xs px-2 py-1 rounded-full ${bgClass}`}>{label}</span>
    </div>
  );
};

export default ProjectStatusLegend;
