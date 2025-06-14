
import React from 'react';

interface TabIndicatorProps {
  tabName: string;
  currentTab: string;
  onClick: () => void;
  label: string;
  className?: string;
}

const TabIndicator: React.FC<TabIndicatorProps> = ({
  tabName,
  currentTab,
  onClick,
  label,
  className = ''
}) => {
  return (
    <button
      className={`px-4 py-3 font-medium text-sm whitespace-nowrap ${
        currentTab === tabName
          ? "border-b-2 border-blue-500 text-blue-600"
          : "text-gray-600 hover:text-gray-800"
      } ${className}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
};

export default TabIndicator;
