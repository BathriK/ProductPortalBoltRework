
import React from 'react';

interface VersionBadgeProps {
  version: number | string;
  date?: string;
  isLatest?: boolean;
}

const VersionBadge: React.FC<VersionBadgeProps> = ({ 
  version, 
  date, 
  isLatest = false 
}) => {
  const formattedDate = date ? new Date(date).toLocaleDateString() : null;

  return (
    <div className={`inline-flex items-center rounded-full px-2 py-1 text-xs ${
      isLatest 
        ? 'bg-green-100 text-green-800' 
        : 'bg-gray-100 text-gray-800'
    }`}>
      <span className="font-medium">v{version}</span>
      {formattedDate && (
        <span className="ml-1 text-xs opacity-70">({formattedDate})</span>
      )}
    </div>
  );
};

export default VersionBadge;
