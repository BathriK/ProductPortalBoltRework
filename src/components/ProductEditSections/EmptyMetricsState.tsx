import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Clipboard } from 'lucide-react';

interface EmptyMetricsStateProps {
  onAddMetric: () => void;
  onPasteData?: () => void;
}

const EmptyMetricsState: React.FC<EmptyMetricsStateProps> = ({ onAddMetric, onPasteData }) => {
  return (
    <div className="text-center py-8 text-gray-500">
      <p className="mb-4 tnq-font">No metrics available</p>
      <div className="flex gap-2 justify-center">
        <Button onClick={onAddMetric} className="tnq-button">
          <Plus size={16} className="mr-2" />
          Add Metric
        </Button>
        {onPasteData && (
          <Button onClick={onPasteData} variant="outline" className="tnq-button-outline">
            <Clipboard size={16} className="mr-2" />
            Paste Data
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyMetricsState;
