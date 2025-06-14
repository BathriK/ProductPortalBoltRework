
import React from 'react';
import { Button } from './ui/button';
import { GitCompare, X } from 'lucide-react';

interface ComparisonToggleProps {
  isComparing: boolean;
  onToggle: () => void;
  currentPeriod: string;
  previousPeriod: string;
  disabled?: boolean;
}

const ComparisonToggle: React.FC<ComparisonToggleProps> = ({
  isComparing,
  onToggle,
  currentPeriod,
  previousPeriod,
  disabled = false
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button 
        variant={isComparing ? "default" : "outline"}
        size="sm" 
        onClick={onToggle}
        disabled={disabled}
        className="flex items-center gap-2"
      >
        {isComparing ? (
          <>
            <X className="h-4 w-4" />
            Exit Comparison
          </>
        ) : (
          <>
            <GitCompare className="h-4 w-4" />
            Compare with Previous Month
          </>
        )}
      </Button>
      
      {isComparing && (
        <div className="text-sm text-gray-600 ml-2">
          Comparing {currentPeriod} vs {previousPeriod}
        </div>
      )}
    </div>
  );
};

export default ComparisonToggle;
